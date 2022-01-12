import { Controller } from '@nestjs/common';
import * as cuid from 'cuid';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { WebsiteService } from '@app/database/websites/websites.service';
import { LoggerService } from '@app/logger';
import { QueueService } from '@app/queue/queue.service';

@Controller()
export class QueueController {
  constructor(
    private queueService: QueueService,
    private websiteService: WebsiteService,
    private logger: LoggerService,
  ) {}

  async queueScans() {
    this.logger.log('starting to enqueue scans...');

    try {
      const websites = await this.websiteService.findAllWebsites();

      for (const website of websites) {
        const coreInput: CoreInputDto = {
          websiteId: website.id,
          url: website.url,
          scanId: cuid(),
        };
        await this.queueService.addCoreJob(coreInput);
      }

      const queueStatus = await this.queueService.getQueueStatus();
      this.logger.log(
        JSON.stringify({ message: 'successfully added to queue', queueStatus }),
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(err.message, err.stack);
    }
  }

  async clearQueue() {
    this.logger.log('starting to clear queue...');

    try {
      this.logger.log('successfully cleared queue');
      await this.queueService.emptyAndClean();
    } catch (error) {
      const err = error as Error;
      this.logger.error(err.message, err.stack);
    }
  }
}
