import { DatabaseModule } from '@app/database';
import { LoggerModule } from '@app/logger';
import { StorageModule } from '@app/storage';
import { Module } from '@nestjs/common';
import { DatetimeModule } from 'libs/datetime/src';
import { SnapshotService } from './snapshot.service';

@Module({
  imports: [StorageModule, DatabaseModule, LoggerModule, DatetimeModule],
  providers: [SnapshotService],
  exports: [SnapshotService],
})
export class SnapshotModule {}
