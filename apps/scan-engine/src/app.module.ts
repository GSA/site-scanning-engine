import { DatabaseModule } from '@app/database';
import { LoggerModule } from '@app/logger';
import { MessageQueueModule } from '@app/message-queue';
import { SolutionsScannerModule } from 'libs/solutions-scanner/src';
import { Module } from '@nestjs/common';
import { CoreScannerModule } from 'libs/core-scanner/src';
import { ScanEngineConsumer } from './scan-engine.consumer';

@Module({
  imports: [
    MessageQueueModule,
    DatabaseModule,
    CoreScannerModule,
    SolutionsScannerModule,
    LoggerModule,
  ],
  providers: [ScanEngineConsumer],
})
export class AppModule {}
