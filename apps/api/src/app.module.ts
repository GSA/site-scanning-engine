import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { DatabaseModule } from '@app/database';

import apiConfig from './website/config/api.config';
import { WebsiteController } from './website/website.controller';
import { AnalysisController } from './analysis/analysis.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [apiConfig],
    }),
    DatabaseModule,
    LoggerModule.forRoot(),
  ],
  controllers: [WebsiteController, AnalysisController],
})
export class AppModule {}
