import { CoreScannerService } from '@app/core-scanner';
import { CoreResultService } from '@app/database/core-results/core-result.service';
import { LoggerService } from '@app/logger';
import { CORE_SCAN_JOB_NAME, SCANNER_QUEUE_NAME } from '@app/message-queue';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { CreateCoreResultDto } from '@app/database/core-results/dto/create-core-result.dto';

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

      const createCoreResult: CreateCoreResultDto = {
        websiteId: job.data.websiteId,
        finalUrl: result.finalUrl,
        finalUrlIsLive: result.finalUrlIsLive,
        finalUrlBaseDomain: result.finalUrlBaseDomain,
        finalUrlMIMEType: result.finalUrlMIMEType,
        finalUrlSameDomain: result.finalUrlSameDomain,
        finalUrlSameWebsite: result.finalUrlSameWebsite,
        targetUrlBaseDomain: result.targetUrlBaseDomain,
        targetUrlRedirects: result.targetUrlRedirects,
      };

      await this.coreResultService.create(createCoreResult);
      this.logger.debug(`wrote result for ${job.data.url}`);
      await job.moveToCompleted();
    } catch (error) {
      this.logger.error(`error scanning ${job.data.url}`, error);
      await job.moveToFailed({
        message: error,
      });
    }
  }
}
