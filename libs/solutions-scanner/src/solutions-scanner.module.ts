import { BrowserModule } from '@app/browser';
import { Module } from '@nestjs/common';
import { SolutionsScannerService } from './solutions-scanner.service';

@Module({
  imports: [BrowserModule],
  providers: [SolutionsScannerService],
  exports: [SolutionsScannerService],
})
export class SolutionsScannerModule {}
