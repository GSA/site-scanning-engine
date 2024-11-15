 

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from '@app/database';

import apiConfig from './website/config/api.config';
import { WebsiteController } from './website/website.controller';
import { AnalysisController } from './analysis/analysis.controller';
import { injectLoggerModule } from "../../../libs/logging/src";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [apiConfig],
    }),
    DatabaseModule,
    injectLoggerModule({ applicationName: "api" }),
  ],
  controllers: [WebsiteController, AnalysisController],
})
export class AppModule {}
