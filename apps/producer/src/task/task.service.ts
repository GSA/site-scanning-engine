import { WebsiteService } from '@app/database/websites/websites.service';
import { LoggerService } from '@app/logger';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { ProducerService } from '../producer/producer.service';
import { CronJob } from 'cron';
import { SnapshotService } from '@app/snapshot';

@Injectable()
export class TaskService {
  constructor(
    private producerService: ProducerService,
    private websiteService: WebsiteService,
    private logger: LoggerService,
    private configService: ConfigService,
    private scheduler: SchedulerRegistry,
    private snapshotService: SnapshotService,
  ) {
    this.logger.setContext(TaskService.name);
  }

  async start() {
    // first clear out the queue
    await this.producerService.emptyAndClean();
    this.logger.debug('producer queue emptied.');

    const scanSchedule =
      this.configService.get<string>('CORE_SCAN_SCHEDULE') || '0 0 * * *';
    this.logger.debug(`core scan schedule ${scanSchedule}`);

    const snapshotSchedule =
      this.configService.get<string>('SNAPSHOT_SCHEDULE') || '0 0 * * *';
    this.logger.debug(`snapshot schedule ${snapshotSchedule}`);

    const coreJob = new CronJob(scanSchedule, async () => {
      await this.coreScanProducer();
    });

    const snapshotJob = new CronJob(snapshotSchedule, async () => {
      await this.snapshot();
    });

    this.scheduler.addCronJob('core-scan', coreJob);
    coreJob.start();

    this.scheduler.addCronJob('weekly-snapshot', snapshotJob);
    snapshotJob.start();
  }

  async coreScanProducer() {
    try {
      const websites = await this.websiteService.findAll();

      for (const website of websites) {
        const coreInput: CoreInputDto = {
          websiteId: website.id,
          url: website.url,
        };
        await this.producerService.addCoreJob(coreInput);
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(err.message, err.stack);
    }
  }

  async snapshot() {
    try {
      this.snapshotService.weeklySnapshot();
    } catch (error) {
      const err = error as Error;
      this.logger.error(err.message, err.stack);
    }
  }
}
