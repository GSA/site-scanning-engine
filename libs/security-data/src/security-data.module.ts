import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityDataService } from './security-data.service';
import securityDataConfig from './config/security-data.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [securityDataConfig],
    }),
  ],
  providers: [SecurityDataService],
  exports: [SecurityDataService],
})
export class SecurityDataModule {}
