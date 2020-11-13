import { CoreScannerService } from '@app/core-scanner';
import { CoreResultService } from '@app/database/core-results/core-result.service';
import { LoggerService } from '@app/logger';
import {
  CORE_SCAN_JOB_NAME,
  USWDS_SCAN_JOB_NAME,
  SCANNER_QUEUE_NAME,
} from '@app/message-queue';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { UswdsResultService } from '@app/database/uswds-result/uswds-result.service';
import { UswdsScannerService } from '@app/uswds-scanner';
import { UswdsInputDto } from '@app/uswds-scanner/uswds.input.dto';

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
    private uswdsScanner: UswdsScannerService,
    private uswdsResultService: UswdsResultService,
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
      const result = await this.coreScanner.scan(job.data);
      await this.coreResultService.create(result);
      this.logger.debug(`wrote result for ${job.data.url}`);
      await job.moveToCompleted();
    } catch (e) {
      const err = e as Error;
      this.logger.error(err.message, err.stack);
      await job.moveToFailed({
        message: err.message,
      });
    }
  }

  @Process({
    name: USWDS_SCAN_JOB_NAME,
    concurrency: 5,
  })
  async processUswds(job: Job<UswdsInputDto>) {
    this.logger.debug(`scanning ${job.data.url} for uswds`);

    try {
      const result = await this.uswdsScanner.scan(job.data);
      await this.uswdsResultService.create(result);

      this.logger.debug(`wrote uswds result for ${job.data.url}`);
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
