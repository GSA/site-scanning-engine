import { Module } from '@nestjs/common';
import { CoreScanner } from '../scanners/core/core.scanner';
import { ScannersModule } from '../scanners/scanners.module';
import { ScanEngineController } from './scan-engine.controller';

@Module({
  imports: [ScannersModule],
  controllers: [ScanEngineController],
  providers: [CoreScanner],
})
export class ScanEngineModule {}
