import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScanEngineModule } from './scan-engine/scan-engine.module';
import { ScannersModule } from './scanners/scanners.module';

@Module({
  imports: [ScanEngineModule, ScannersModule, ConfigModule.forRoot()],
  controllers: [],
  providers: [],
})
export class AppModule {}
