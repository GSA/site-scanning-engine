import { WebsiteService } from '@app/database/websites/websites.service';
import { LoggerService } from '@app/logger';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CoreInputDto } from 'common/dtos/scanners/core.input.dto';
import { ProducerService } from '../producer/producer.service';
import { CronJob } from 'cron';

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
    const schedule =
      this.configService.get('CORE_SCAN_SCHEDULE') || '*/10 * * * *';
    this.logger.debug(`using schedule ${schedule}`);

    const job = new CronJob(schedule, async () => {
      await this.coreScanProducer();
    });

    this.scheduler.addCronJob('core-scan', job);
    job.start();
  }

  async coreScanProducer() {
    try {
      await this.producerService.empty();

      const websites = await this.websiteService.findAll();
      websites.forEach(website => {
        const coreInput: CoreInputDto = {
          websiteId: website.id,
          url: website.url,
        };
        this.producerService.addCoreJob(coreInput);
      });
    } catch (error) {
      this.logger.error(`error in ${this.coreScanProducer.name}`, error);
    }
  }
}
