import { DatabaseModule } from '@app/database';
import { WebsiteService } from '@app/database/websites/websites.service';
import { MessageQueueModule } from '@app/message-queue';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ProducerService } from './producer/producer.service';
import { TaskService } from './task/task.service';

@Module({
  imports: [
    DatabaseModule,
    MessageQueueModule,
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
  ],
  providers: [ProducerService, TaskService, WebsiteService],
})
export class ProducerModule {}
