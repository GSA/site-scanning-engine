import { BrowserModule } from '@app/browser';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CoreScannerService } from './core-scanner.service';
import { SecurityDataModule } from '@app/security-data';

@Module({
  imports: [BrowserModule, HttpModule, SecurityDataModule],
  providers: [CoreScannerService],
  exports: [CoreScannerService],
})
export class CoreScannerModule {}
