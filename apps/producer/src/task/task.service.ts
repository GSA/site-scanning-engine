import { WebsiteService } from '@app/database/websites/websites.service';
import { LoggerService } from '@app/logger';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { ProducerService } from '../producer/producer.service';
import { CronJob } from 'cron';
import { UswdsInputDto } from '@app/uswds-scanner/uswds.input.dto';

@Injectable()
export class TaskService {
  constructor(
    private producerService: ProducerService,
    private websiteService: WebsiteService,
    private logger: LoggerService,
    private configService: ConfigService,
    private scheduler: SchedulerRegistry,
  ) {
    this.logger.setContext(TaskService.name);
  }

  async start() {
    // first clear out the queue
    await this.producerService.emptyAndClean();
    this.logger.debug('producer queue emptied.');

    const schedule =
      this.configService.get<string>('CORE_SCAN_SCHEDULE') || '0 0 * * *';
    this.logger.debug(`using schedule ${schedule}`);

    const coreJob = new CronJob(schedule, async () => {
      await this.coreScanProducer();
    });

    this.scheduler.addCronJob('core-scan', coreJob);
    coreJob.start();
  }

  async coreScanProducer() {
    try {
      const websites = await this.websiteService.findAll();
      websites.forEach(website => {
        const coreInput: CoreInputDto = {
          websiteId: website.id,
          url: website.url,
        };
        this.producerService.addCoreJob(coreInput);

        const uswdsInput: UswdsInputDto = {
          websiteId: website.id,
          url: website.url,
        };
        this.producerService.addUswdsJob(uswdsInput);
      });
    } catch (error) {
      this.logger.error(`error in ${this.coreScanProducer.name}`, error);
    }
  }
}
