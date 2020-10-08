import { MessageQueueModule } from '@app/message-queue';
import { Module } from '@nestjs/common';
import { CoreScanner } from '../scanners/core/core.scanner';
import { ScannersModule } from '../scanners/scanners.module';
import { ScanEngineConsumer } from './scan-engine.consumer';

@Module({
  imports: [ScannersModule, MessageQueueModule],
  providers: [CoreScanner, ScanEngineConsumer],
})
export class ScanEngineModule {}
