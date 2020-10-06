import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ProducerService } from '../producer.service';

@Injectable()
export class TaskService {
  private readonly logger: Logger;
  constructor(private producerService: ProducerService) {
    this.logger = new Logger(TaskService.name);
  }

  @Cron('46 * * * * *')
  async coreScanProducer() {
    this.logger.debug('Called at 46 seconds into every minute.');

    const input = {
      url: 'https://18f.gov',
      agency: 'GSA',
      branch: 'Executive',
    };
    this.producerService.addCoreJob(input);
  }
}
