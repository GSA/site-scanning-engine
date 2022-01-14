import { DatabaseModule } from '@app/database';
import { WebsiteModule } from '@app/database/websites/website.module';
import { HttpModule, Module } from '@nestjs/common';
import { IngestService } from './ingest.service';

@Module({
  imports: [HttpModule, WebsiteModule, DatabaseModule],
  providers: [IngestService],
  exports: [IngestService],
})
export class IngestModule {}
