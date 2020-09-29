import { Module } from '@nestjs/common';
import { ScanEngineModule } from './scan-engine/scan-engine.module';
import { ScannersModule } from './scanners/scanners.module';

@Module({
  imports: [ScanEngineModule, ScannersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
