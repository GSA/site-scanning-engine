import { Module } from '@nestjs/common';
import { UswdsScannerService } from './uswds-scanner.service';

@Module({
  providers: [UswdsScannerService],
  exports: [UswdsScannerService],
})
export class UswdsScannerModule {}
