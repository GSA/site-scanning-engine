import { DatabaseModule } from '@app/database';
import { LoggerModule } from '@app/logger';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import apiConfig from './website/config/api.config';
import { WebsiteController } from './website/website.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [apiConfig],
    }),
    DatabaseModule,
    LoggerModule,
  ],
  controllers: [WebsiteController],
})
export class AppModule {}
