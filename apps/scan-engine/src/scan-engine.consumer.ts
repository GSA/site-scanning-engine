import { CoreScannerService } from '@app/core-scanner';
import { CoreResultService } from '@app/database/core-results/core-result.service';
import { LoggerService } from '@app/logger';
import { CORE_SCAN_JOB_NAME, SCANNER_QUEUE_NAME } from '@app/message-queue';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { SolutionsResultService } from '@app/database/solutions-results/solutions-result.service';
import { SolutionsScannerService } from 'libs/solutions-scanner/src';

/**
 * ScanEngineConsumer is a consumer of the Scanner message queue.
 *
 * @remarks the ScanEngineConsumer pulls work off of the Scanner queue and processes it.
 * The methods in ScanConsumer should use the `Process` decorator. This allows us to route
 * named jobs to the correct processor, e.g.
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
    private solutionsScanner: SolutionsScannerService,
    private solutionsResultService: SolutionsResultService,
    private logger: LoggerService,
  ) {
    this.logger.setContext(ScanEngineConsumer.name);
  }

  /**
   * processCore processes the CoreScanner jobs from the queue.
   *
   * @param job a Bull.Job<CoreInputDto> object.
   */
  @Process({
    name: CORE_SCAN_JOB_NAME,
    concurrency: 5,
  })
  async processCore(job: Job<CoreInputDto>) {
    this.logger.debug(`scanning ${job.data.url}`);

    try {
      // add core result
      const coreResult = await this.coreScanner.scan(job.data);
      await this.coreResultService.create(coreResult);
      this.logger.debug(`wrote core result for ${job.data.url}`);

      // add solutions result
      const solutionsResult = await this.solutionsScanner.scan(job.data);
      await this.solutionsResultService.create(solutionsResult);
      this.logger.debug(`wrote core result for ${job.data.url}`);

      await job.moveToCompleted();
    } catch (e) {
      const err = e as Error;
      this.logger.error(err.message, err.stack);
      await job.moveToFailed({
        message: err.message,
      });
    }
  }
}
