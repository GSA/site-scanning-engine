import { Module } from '@nestjs/common';

import { DatabaseModule } from '@app/database';
import { IngestModule } from '@app/ingest';
import { LoggerModule } from '@app/logger';
import { QueueModule } from '@app/queue';

import { IngestController } from './ingest.controller';
import { QueueController } from './queue.controller';
import { SnapshotController } from './snapshot.controller';
import { SnapshotModule } from '@app/snapshot';

@Module({
  imports: [
    DatabaseModule,
    IngestModule,
    LoggerModule,
    QueueModule,
    SnapshotModule,
  ],
  controllers: [IngestController, QueueController, SnapshotController],
})
export class AppModule {}
