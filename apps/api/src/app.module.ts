import { DatabaseModule } from '@app/database';
import { WebsiteService } from '@app/database/websites/websites.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RootController } from './root/root.controller';
import { WebsiteController } from './website/website.controller';
import { ResultsController } from './results/results.controller';
import { CoreResultService } from '@app/database/core-results/core-result.service';

@Module({
  imports: [ConfigModule.forRoot(), DatabaseModule],
  controllers: [WebsiteController, RootController, ResultsController],
  providers: [WebsiteService, CoreResultService],
})
export class AppModule {}
