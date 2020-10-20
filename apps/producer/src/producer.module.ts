import { DatabaseModule } from '@app/database';
import { WebsiteService } from '@app/database/websites/websites.service';
import { MessageQueueModule } from '@app/message-queue';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule, LoggerService } from 'libs/logger/src';
import { ProducerService } from './producer/producer.service';
import { TaskService } from './task/task.service';

@Module({
  imports: [
    DatabaseModule,
    MessageQueueModule,
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    LoggerModule,
  ],
  providers: [ProducerService, TaskService, WebsiteService, LoggerService],
})
export class ProducerModule {}
