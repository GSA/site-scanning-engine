import { Module } from '@nestjs/common';

import { MessageQueueModule } from '@app/message-queue';
import { ProducerService } from './producer.service';

@Module({
  imports: [MessageQueueModule],
  providers: [ProducerService],
  exports: [ProducerService],
})
export class ProducerModule {}
