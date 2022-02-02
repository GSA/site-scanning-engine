import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import mqConfig from './config/mq.config';

const SCANNER_QUEUE_NAME = 'ScannerQueue';
const CORE_SCAN_JOB_NAME = 'core';

const ScannerQueue = BullModule.registerQueueAsync({
  name: SCANNER_QUEUE_NAME,
  imports: [
    ConfigModule.forRoot({
      load: [mqConfig],
    }),
  ],
  useFactory: async (configService: ConfigService) => ({
    redis: {
      host: configService.get('redis.host'),
      port: +configService.get<number>('redis.port'),
      password: configService.get('redis.password'),
      tls: configService.get('redis.env') === 'dev' ? undefined : {},
    },
  }),
  inject: [ConfigService],
});

@Module({
  imports: [ScannerQueue],
  exports: [ScannerQueue],
})
export class MessageQueueModule {}

export { SCANNER_QUEUE_NAME, CORE_SCAN_JOB_NAME };
