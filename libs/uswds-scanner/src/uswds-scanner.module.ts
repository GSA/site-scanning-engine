import { BrowserModule } from '@app/browser';
import { LoggerModule } from '@app/logger';
import { Module } from '@nestjs/common';
import { UswdsScannerService } from './uswds-scanner.service';

@Module({
  imports: [BrowserModule, LoggerModule],
  providers: [UswdsScannerService],
  exports: [UswdsScannerService],
})
export class UswdsScannerModule {}
