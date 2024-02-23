import { DatabaseModule } from '@app/database';
import { WebsiteModule } from '@app/database/websites/website.module';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IngestService } from './ingest.service';
import { ConfigModule } from '@nestjs/config';
import { UrlListDataFetcher } from './url-list-data-fetcher';
import ingestConfig from './config/ingest.config';

@Module({
  imports: [
    HttpModule,
    WebsiteModule,
    DatabaseModule,
    ConfigModule.forRoot({
      load: [ingestConfig],
    }),
  ],
  providers: [IngestService, UrlListDataFetcher],
  exports: [IngestService],
})
export class IngestModule {}
