import { BrowserModule, BrowserService } from '@app/browser';
import { Module } from '@nestjs/common';
import { CoreScannerService } from './core-scanner.service';

@Module({
  imports: [BrowserModule],
  providers: [CoreScannerService, BrowserService],
  exports: [CoreScannerService, BrowserModule],
})
export class CoreScannerModule {}
