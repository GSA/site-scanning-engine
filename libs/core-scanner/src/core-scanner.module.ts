import { BrowserModule, BrowserService } from '@app/browser';
import { LoggerModule } from '@app/logger';
import { Module } from '@nestjs/common';
import { CoreScannerService } from './core-scanner.service';

@Module({
  imports: [BrowserModule, LoggerModule],
  providers: [CoreScannerService, BrowserService],
  exports: [CoreScannerService, BrowserModule],
})
export class CoreScannerModule {}
