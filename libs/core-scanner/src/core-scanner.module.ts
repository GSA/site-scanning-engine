import { BrowserModule, BrowserService } from '@app/browser';
import { LoggerModule } from '@app/logger';
import { HttpModule, Module } from '@nestjs/common';
import { CoreScannerService } from './core-scanner.service';

@Module({
  imports: [BrowserModule, LoggerModule, HttpModule],
  providers: [CoreScannerService, BrowserService],
  exports: [CoreScannerService, BrowserModule, HttpModule],
})
export class CoreScannerModule {}
