/* eslint-disable @typescript-eslint/no-unused-vars */

import { Module } from '@nestjs/common';

import { DatabaseModule } from '@app/database';
import { MessageQueueModule } from '@app/message-queue';
import { QueueModule } from '@app/queue';

import { CoreScannerModule } from 'libs/core-scanner/src';
import { ScanEngineConsumer } from './scan-engine.consumer';
import { injectLoggerModule } from "../../../libs/logging/src";

@Module({
  imports: [
    MessageQueueModule,
    DatabaseModule,
    CoreScannerModule,
    injectLoggerModule({ applicationName: "scan-engine" }),
    QueueModule,
  ],
  providers: [ScanEngineConsumer],
})
export class AppModule {}
