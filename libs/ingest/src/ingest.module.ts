import { DatabaseModule } from '@app/database';
import { WebsiteModule } from '@app/database/websites/website.module';
import { LoggerModule } from '@app/logger';
import { HttpModule, Module } from '@nestjs/common';
import { IngestService } from './ingest.service';

@Module({
  imports: [HttpModule, WebsiteModule, DatabaseModule, LoggerModule],
  providers: [IngestService],
  exports: [IngestService],
})
export class IngestModule {}
