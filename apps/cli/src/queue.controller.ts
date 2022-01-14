import { Controller, Logger } from '@nestjs/common';
import * as cuid from 'cuid';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { WebsiteService } from '@app/database/websites/websites.service';
import { QueueService } from '@app/queue/queue.service';

@Controller()
export class QueueController {
  private readonly logger = new Logger(QueueController.name);

  constructor(
    private queueService: QueueService,
    private websiteService: WebsiteService,
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
      this.logger.log({ msg: 'successfully added to queue', queueStatus });
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
