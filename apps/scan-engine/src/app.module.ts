import { DatabaseModule } from '@app/database';
import { LoggerModule } from '@app/logger';
import { MessageQueueModule } from '@app/message-queue';
import { UswdsScannerModule } from '@app/uswds-scanner';
import { Module } from '@nestjs/common';
import { CoreScannerModule } from 'libs/core-scanner/src';
import { ScanEngineConsumer } from './scan-engine.consumer';

@Module({
  imports: [
    MessageQueueModule,
    DatabaseModule,
    CoreScannerModule,
    UswdsScannerModule,
    LoggerModule,
  ],
  providers: [ScanEngineConsumer],
})
export class AppModule {}
