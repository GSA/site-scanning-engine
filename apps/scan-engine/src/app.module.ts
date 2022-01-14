import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import pino from 'pino';

import { DatabaseModule } from '@app/database';
import { MessageQueueModule } from '@app/message-queue';
import { QueueModule } from '@app/queue';

import { SolutionsScannerModule } from 'libs/solutions-scanner/src';
import { CoreScannerModule } from 'libs/core-scanner/src';
import { ScanEngineConsumer } from './scan-engine.consumer';

const logger = pino(
  {
    level: process.env.NODE_ENV !== 'prod' ? 'debug' : 'info',
  },
  pino.destination({
    minLength: 4096,
    sync: false,
  }),
);

setInterval(function () {
  logger.flush();
}, 5000).unref();

@Module({
  imports: [
    MessageQueueModule,
    DatabaseModule,
    CoreScannerModule,
    SolutionsScannerModule,
    LoggerModule.forRoot(),
    QueueModule,
  ],
  providers: [ScanEngineConsumer],
})
export class AppModule {}
