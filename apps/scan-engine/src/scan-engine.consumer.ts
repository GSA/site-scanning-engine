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
import { Job } from 'bull';

import { CoreScannerService } from '@app/core-scanner';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { CoreResultService } from '@app/database/core-results/core-result.service';
import { SolutionsResultService } from '@app/database/solutions-results/solutions-result.service';
import { LoggerService } from '@app/logger';
import { QueueService } from '@app/queue';
import { SolutionsScannerService } from 'libs/solutions-scanner/src';

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
  constructor(
    private coreScanner: CoreScannerService,
    private coreResultService: CoreResultService,
    private queueService: QueueService,
    private solutionsScanner: SolutionsScannerService,
    private solutionsResultService: SolutionsResultService,
    private logger: LoggerService,
  ) {
    //this.logger.setContext(ScanEngineConsumer.name);
  }

  /**
   * processCore processes the CoreScanner jobs from the queue.
   *
   * @param job a Bull.Job<CoreInputDto> object.
   */
  @Process({
    name: CORE_SCAN_JOB_NAME,
    concurrency: 3,
  })
  async processCore(job: Job<CoreInputDto>) {
    this.logger.debug(`scanning ${job.data.url} ${job.id}`);

    try {
      // add core result
      const coreResult = await this.coreScanner.scan(job.data);
      await this.coreResultService.create(coreResult);
      this.logger.log(`wrote core result for ${job.data.url}`);

      // add solutions result
      const solutionsResult = await this.solutionsScanner.scan(job.data);
      await this.solutionsResultService.create(solutionsResult);
      this.logger.log(`wrote solutions result for ${job.data.url}`);

      const queueStatus = await this.queueService.getQueueStatus();
      this.logger.log(
        JSON.stringify({ message: 'queue status', queue: queueStatus }),
      );
    } catch (e) {
      const err = e as Error;
      this.logger.error(err.message, err.stack);
    }
  }

  @OnQueueActive()
  onActive(job: Job<CoreInputDto>) {
    this.logger.log(
      `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(
        job.data,
      )}...`,
    );
  }

  @OnQueueStalled()
  onStalled(job: Job<CoreInputDto>) {
    this.logger.warn(
      `Queue stalled while processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }

  @OnQueueDrained()
  onDrained() {
    this.logger.log(`Queue successfully drained.`);
  }

  @OnQueueError()
  onError(error: Error) {
    this.logger.error(
      `Queue Error "${error.name}" detected: ${error.message}`,
      error.stack,
    );
  }

  @OnQueueCompleted()
  onCompleted(job: Job<CoreInputDto>, _: any) {
    this.logger.log(
      `Processed job ${job.id} of type ${job.name} with data ${JSON.stringify(
        job.data,
      )}`,
    );
  }
}
