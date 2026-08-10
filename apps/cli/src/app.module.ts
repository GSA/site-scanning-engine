import { Module } from '@nestjs/common';

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
import { DataFreshnessController } from './data-freshness.controller';
import { injectLoggerModule } from '../../../libs/logging/src';

@Module({
  imports: [
    CoreScannerModule,
    DatabaseModule,
    IngestModule,
    injectLoggerModule({ applicationName: 'cli' }),
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
    DataFreshnessController,
  ],
})
export class AppModule {}
