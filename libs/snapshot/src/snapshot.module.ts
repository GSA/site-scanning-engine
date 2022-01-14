import { DatabaseModule } from '@app/database';
import { StorageModule } from '@app/storage';
import { Module } from '@nestjs/common';
import { DatetimeModule } from 'libs/datetime/src';
import { SnapshotService } from './snapshot.service';

@Module({
  imports: [StorageModule, DatabaseModule, DatetimeModule],
  providers: [SnapshotService],
  exports: [SnapshotService],
})
export class SnapshotModule {}
