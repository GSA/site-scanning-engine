import { BrowserModule } from '@app/browser';
import { Module } from '@nestjs/common';
import { UswdsScannerService } from './uswds-scanner.service';

@Module({
  imports: [BrowserModule],
  providers: [UswdsScannerService],
  exports: [UswdsScannerService],
})
export class UswdsScannerModule {}
