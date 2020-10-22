import { DatabaseModule } from '@app/database';
import { CoreResultService } from '@app/database/core-results/core-result.service';
import { LoggerModule, LoggerService } from '@app/logger';
import { MessageQueueModule } from '@app/message-queue';
import { Module } from '@nestjs/common';
import { CoreScannerModule, CoreScannerService } from 'libs/core-scanner/src';
import { ScanEngineConsumer } from './scan-engine.consumer';

@Module({
  imports: [
    MessageQueueModule,
    DatabaseModule,
    CoreScannerModule,
    LoggerModule,
  ],
  providers: [
    CoreScannerService,
    CoreResultService,
    LoggerService,
    ScanEngineConsumer,
  ],
})
export class AppModule {}
