import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { DatabaseModule } from '@app/database';
import { IngestModule } from '@app/ingest';
import { QueueModule } from '@app/queue';

import { IngestController } from './ingest.controller';
import { QueueController } from './queue.controller';
import { SnapshotController } from './snapshot.controller';
import { SnapshotModule } from '@app/snapshot';

@Module({
  imports: [
    DatabaseModule,
    IngestModule,
    LoggerModule.forRoot({
      pinoHttp: {
        name: 'add some name to every JSON line',
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
      },
    }),
    QueueModule,
    SnapshotModule,
  ],
  controllers: [IngestController, QueueController, SnapshotController],
})
export class AppModule {}
