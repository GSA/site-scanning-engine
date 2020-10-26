import { IngestModule } from '@app/ingest';
import { Module } from '@nestjs/common';
import { IngestController } from './ingest.controller';

@Module({
  imports: [IngestModule],
  controllers: [IngestController],
})
export class AppModule {}
