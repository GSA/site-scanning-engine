import { Module } from '@nestjs/common';

import { MessageQueueModule } from '@app/message-queue';
import { QueueService } from './queue.service';

@Module({
  imports: [MessageQueueModule],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
