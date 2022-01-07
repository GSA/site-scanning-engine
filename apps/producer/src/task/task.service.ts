import { CronJob } from 'cron';
import * as cuid from 'cuid';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { WebsiteService } from '@app/database/websites/websites.service';
import { LoggerService } from '@app/logger';
import { SnapshotService } from '@app/snapshot';

import { ProducerService } from '../producer/producer.service';

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
    this.logger.log('producer queue emptied.');

    const scanSchedule =
      this.configService.get<string>('CORE_SCAN_SCHEDULE') || '0 0 * * *';
    this.logger.log(`core scan schedule ${scanSchedule}`);

    const snapshotSchedule =
      this.configService.get<string>('SNAPSHOT_SCHEDULE') || '0 0 * * *';
    this.logger.log(`snapshot schedule ${snapshotSchedule}`);

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
    this.logger.log('starting the Scan Engine Producer...');

    try {
      const websites = await this.websiteService.findAllWebsites();

      for (const website of websites) {
        const coreInput: CoreInputDto = {
          websiteId: website.id,
          url: website.url,
          scanId: cuid(),
        };
        await this.producerService.addCoreJob(coreInput);
      }

      this.logger.log('successfully added to queue');
    } catch (error) {
      const err = error as Error;
      this.logger.error(err.message, err.stack);
    }
  }

  async snapshot() {
    this.logger.log('starting the Snapshot Producer...');
    try {
      await this.snapshotService.weeklySnapshot();
      this.logger.log('sucessfully added snapshot');
    } catch (error) {
      const err = error as Error;
      this.logger.error(err.message, err.stack);
    }
  }
}
