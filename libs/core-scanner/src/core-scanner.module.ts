import { BrowserModule } from '@app/browser';
import { HttpModule, Module } from '@nestjs/common';
import { CoreScannerService } from './core-scanner.service';

@Module({
  imports: [BrowserModule, HttpModule],
  providers: [CoreScannerService],
  exports: [CoreScannerService],
})
export class CoreScannerModule {}
