import { WebsiteService } from '@app/database/websites/websites.service';
import { LoggerService } from '@app/logger';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CoreInputDto } from 'common/dtos/scanners/core.input.dto';
import { ProducerService } from '../producer/producer.service';

@Injectable()
export class TaskService {
  constructor(
    private producerService: ProducerService,
    private websiteService: WebsiteService,
    private logger: LoggerService,
  ) {
    this.logger.setContext(TaskService.name);
  }

  @Cron('*/10 * * * *')
  async coreScanProducer() {
    this.logger.debug('Called every 10 minutes.');

    try {
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
