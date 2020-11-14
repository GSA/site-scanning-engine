import { BrowserModule } from '@app/browser';
import { LoggerModule } from '@app/logger';
import { Module } from '@nestjs/common';
import { SolutionsScannerService } from './solutions-scanner.service';

@Module({
  imports: [BrowserModule, LoggerModule],
  providers: [SolutionsScannerService],
  exports: [SolutionsScannerService],
})
export class SolutionsScannerModule {}
