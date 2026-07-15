import { CORE_SCAN_JOB_NAME, SCANNER_QUEUE_NAME } from '@app/message-queue';
import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueDrained,
  OnQueueError,
  OnQueueFailed,
  OnQueueStalled,
  Process,
  Processor,
} from '@nestjs/bull';
// use as NestLogger to avoid confusion with `Logger` from Pino that is used
// in `entities/scan-status`
import { Logger as NestLogger } from '@nestjs/common';
import { Job } from 'bull';

import { CoreScannerService } from '@app/core-scanner';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { CoreResultService } from '@app/database/core-results/core-result.service';
import { QueueService } from '@app/queue';
import { isPermanentFailure, parseBrowserError } from 'entities/scan-status';

/**
 * ScanEngineConsumer is a consumer of the Scanner message queue.
 *
 * @remarks the ScanEngineConsumer pulls work off of the Scanner queue and processes it.
 * The methods in ScanConsumer should use the `Process` decorator. This allows us to route
 * named jobs to the correct processor, e.g.
 *
 * ScanEngineConsumer also provides several useful event listeners for understanding the
 * state of the queue at various times.
 *
 * ```ts
 * @Process('SomeNamedJob')
 * async processSomeNamedJob(job: Job<SomeNameJobDto>) {
 * ...
 * };
 * ```
 */
@Processor(SCANNER_QUEUE_NAME)
export class ScanEngineConsumer {
  private logger = new NestLogger(ScanEngineConsumer.name);

  constructor(
    private coreResultService: CoreResultService,
    private queueService: QueueService,
    private coreScanner: CoreScannerService,
  ) {}

  /**
   * processCore processes the CoreScanner jobs from the queue.
   *
   * @param job a Bull.Job<CoreInputDto> object.
   */
  @Process({
    name: CORE_SCAN_JOB_NAME,
    concurrency: 2,
  })
  async processCore(job: Job<CoreInputDto>) {
    this.logger.debug({
      msg: `scanning ${job.data.url} ${job.id}`,
      job,
    });

    try {
      // scan core and solutions results
      const coreResultPages = await this.coreScanner.scan(job.data);
      await this.coreResultService.createFromCoreResultPages(
        job.data.websiteId,
        coreResultPages,
        this.logger,
        job.data.filter,
        job.data.pageviews,
        job.data.visits,
        job.data.url,
      );
      this.logger.log({
        msg: `wrote core result for ${job.data.url}`,
        job,
      });

      const queueStatus = await this.queueService.getQueueStatus();
      this.logger.log({ msg: 'queue status', queue: queueStatus });
    } catch (e) {
      const err = e as Error;
      this.logger.error(err.message, err.stack);

      // Classify once — parseBrowserError is the single source of truth for
      // error → ScanStatus mapping. isPermanentFailure determines retry policy.
      const failureStatus = parseBrowserError(err);

      if (isPermanentFailure(failureStatus)) {
        this.logger.warn(`Permanent failure for ${job.data.url}, not retrying`);

        await this.coreResultService.writeFailedResult(
          job.data.websiteId,
          failureStatus,
          this.logger,
          job.data.filter,
          job.data.pageviews,
          job.data.visits,
          job.data.url,
        );

        this.logger.log({
          msg: `wrote failure result for ${job.data.url}`,
          status: failureStatus,
          job,
        });

        return;
      }

      // re-throw so Bull retries
      throw err;
    }
  }

  @OnQueueActive()
  onActive(job: Job<CoreInputDto>) {
    this.logger.log({
      msg: `Processing job ${job.id} of type ${job.name}`,
      job,
    });
  }

  @OnQueueStalled()
  onStalled(job: Job<CoreInputDto>) {
    this.logger.warn({
      msg: `Queue stalled while processing job ${job.id} of type ${job.name}`,
      job,
    });
  }

  @OnQueueDrained()
  onDrained() {
    this.logger.log('Queue successfully drained.');
  }

  @OnQueueError()
  onError(error: Error) {
    this.logger.error({
      msg: `Queue Error "${error.name}" detected: ${error.message}`,
      error,
    });
  }

  @OnQueueCompleted()
  onCompleted(job: Job<CoreInputDto>) {
    this.logger.log({
      msg: 'Processed job',
      job,
    });
  }

  /**
   * onFailed handles the `failed` event, which fires after every failed
   * attempt (including intermediate retries).
   *
   * We only write a failure result once retries are exhausted
   * (attemptsMade >= opts.attempts). On intermediate attempts we log and
   * return so we can requeue and try again.
   *
   * This covers non-permanent errors (e.g. Timeout, ConnectionReset).
   * After the final attempt we classify the error via parseBrowserError and
   * persist a failure result so the scan_date is updated.
   *
   * Permanent errors are handled inside processCore and
   * return without throwing, so those jobs never reach the failed set, and
   * this handler is not invoked for them.
   */
  @OnQueueFailed()
  async onFailed(job: Job<CoreInputDto>, err: Error) {
    const attempts = job.opts.attempts ?? 1;

    if (job.attemptsMade < attempts) {
      // Intermediate attempt — Bull will retry; nothing to persist yet.
      this.logger.warn({
        msg: `Job ${job.id} failed (attempt ${job.attemptsMade}/${attempts}), will retry`,
        url: job.data.url,
        error: err.message,
      });
      return;
    }

    // Final attempt exhausted — write a failure result so the row is updated.
    this.logger.warn({
      msg: `Job ${job.id} failed after all ${attempts} attempts, writing failure result`,
      url: job.data.url,
      error: err.message,
    });

    const failureStatus = parseBrowserError(err);

    await this.coreResultService.writeFailedResult(
      job.data.websiteId,
      failureStatus,
      this.logger,
      job.data.filter,
      job.data.pageviews,
      job.data.visits,
      job.data.url,
    );

    this.logger.log({
      msg: `wrote failure result for ${job.data.url} after exhausted retries`,
      status: failureStatus,
      job,
    });
  }
}
