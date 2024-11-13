import { CORE_SCAN_JOB_NAME, SCANNER_QUEUE_NAME } from '@app/message-queue';
import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueDrained,
  OnQueueError,
  OnQueueStalled,
  Process,
  Processor,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { CoreScannerService } from '@app/core-scanner';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { CoreResultService } from '@app/database/core-results/core-result.service';
import { QueueService } from '@app/queue';

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
  private logger = new Logger(ScanEngineConsumer.name);

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
    concurrency: 4,
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
}
