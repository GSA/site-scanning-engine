import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { CoreScannerModule } from '@app/core-scanner';
import { DatabaseModule } from '@app/database';
import { IngestModule } from '@app/ingest';
import { QueueModule } from '@app/queue';
import { SnapshotModule } from '@app/snapshot';
import { SecurityDataModule } from '@app/security-data';

import { IngestController } from './ingest.controller';
import { QueueController } from './queue.controller';
import { ScanController } from './scan.controller';
import { SnapshotController } from './snapshot.controller';
import { SecurityDataController } from './security-data.controller';

@Module({
  imports: [
    CoreScannerModule,
    DatabaseModule,
    IngestModule,
    LoggerModule.forRoot({
      pinoHttp: {
        name: 'cli',
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
      },
    }),
    QueueModule,
    SnapshotModule,
    SecurityDataModule,
  ],
  controllers: [
    IngestController,
    QueueController,
    ScanController,
    SnapshotController,
    SecurityDataController,
  ],
})
export class AppModule {}
