import { Module } from '@nestjs/common';

import { DatabaseModule } from '@app/database';
import { LoggerModule } from '@app/logger';
import { MessageQueueModule } from '@app/message-queue';
import { QueueModule } from '@app/queue';
import { SolutionsScannerModule } from 'libs/solutions-scanner/src';
import { CoreScannerModule } from 'libs/core-scanner/src';
import { ScanEngineConsumer } from './scan-engine.consumer';

@Module({
  imports: [
    MessageQueueModule,
    DatabaseModule,
    CoreScannerModule,
    SolutionsScannerModule,
    LoggerModule,
    QueueModule,
  ],
  providers: [ScanEngineConsumer],
})
export class AppModule {}
