import { BrowserModule } from '@app/browser';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CoreScannerService } from './core-scanner.service';

@Module({
  imports: [BrowserModule, HttpModule],
  providers: [CoreScannerService],
  exports: [CoreScannerService],
})
export class CoreScannerModule {}
