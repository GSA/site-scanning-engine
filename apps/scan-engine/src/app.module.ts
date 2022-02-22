import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { DatabaseModule } from '@app/database';
import { MessageQueueModule } from '@app/message-queue';
import { QueueModule } from '@app/queue';

import { CoreScannerModule } from 'libs/core-scanner/src';
import { ScanEngineConsumer } from './scan-engine.consumer';

@Module({
  imports: [
    MessageQueueModule,
    DatabaseModule,
    CoreScannerModule,
    LoggerModule.forRoot(),
    QueueModule,
  ],
  providers: [ScanEngineConsumer],
})
export class AppModule {}
