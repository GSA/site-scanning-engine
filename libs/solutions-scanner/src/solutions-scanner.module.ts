import { HttpModule, Module } from '@nestjs/common';

import { BrowserModule } from '@app/browser';
import { SolutionsScannerService } from './solutions-scanner.service';

@Module({
  imports: [BrowserModule, HttpModule],
  providers: [SolutionsScannerService],
  exports: [SolutionsScannerService],
})
export class SolutionsScannerModule {}
