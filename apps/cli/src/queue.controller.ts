import { Controller } from '@nestjs/common';
import * as cuid from 'cuid';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { WebsiteService } from '@app/database/websites/websites.service';
import { LoggerService } from '@app/logger';
import { ProducerService } from '@app/producer/producer.service';

@Controller()
export class QueueController {
  constructor(
    private producerService: ProducerService,
    private websiteService: WebsiteService,
    private logger: LoggerService,
  ) {}

  async queueScans() {
    this.logger.log('starting to queue scans...');

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

  async clearQueue() {
    this.logger.log('starting to clear queue...');

    try {
      this.logger.log('successfully cleared queue');
      await this.producerService.emptyAndClean();
    } catch (error) {
      const err = error as Error;
      this.logger.error(err.message, err.stack);
    }
  }
}
