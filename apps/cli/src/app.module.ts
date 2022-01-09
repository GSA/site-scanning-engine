import { Module } from '@nestjs/common';

import { DatabaseModule } from '@app/database';
import { IngestModule } from '@app/ingest';
import { LoggerModule } from '@app/logger';
import { ProducerModule } from '@app/producer';

import { IngestController } from './ingest.controller';
import { QueueController } from './queue.controller';

@Module({
  imports: [DatabaseModule, IngestModule, LoggerModule, ProducerModule],
  controllers: [IngestController, QueueController],
})
export class AppModule {}
