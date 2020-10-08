import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

const SCANNER_QUEUE_NAME = 'ScannerQueue';
const CORE_SCAN_JOB_NAME = 'core';
const QUEUE_HOST_KEY = 'QUEUE_HOST';
const QUEUE_PORT_KEY = 'QUEUE_PORT';

const ScannerQueue = BullModule.registerQueueAsync({
  name: SCANNER_QUEUE_NAME,
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    redis: {
      host: configService.get(QUEUE_HOST_KEY),
      port: configService.get(QUEUE_PORT_KEY),
    },
  }),
  inject: [ConfigService],
});

@Module({
  imports: [ScannerQueue],
  exports: [ScannerQueue],
})
export class MessageQueueModule {}

export {
  SCANNER_QUEUE_NAME,
  CORE_SCAN_JOB_NAME,
  QUEUE_HOST_KEY,
  QUEUE_PORT_KEY,
};
