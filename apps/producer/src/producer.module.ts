import { Module } from '@nestjs/common';
import { ProducerService } from './producer.service';
import { BullModule } from '@nestjs/bull';
import { SCANNER_QUEUE_NAME } from '../../const/const';
import { TaskService } from './task/task.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    BullModule.registerQueueAsync({
      name: SCANNER_QUEUE_NAME,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ProducerService, TaskService],
})
export class ProducerModule {}
