import { Injectable, Logger } from '@nestjs/common';
import { WebsiteService } from '@app/database/websites/websites.service';
import { StorageService } from '@app/storage';
import { DatetimeService } from 'libs/datetime/src';
import { Snapshot } from './snapshot';
import { JsonSerializer } from './serializers/json-serializer';
import { CsvSerializer } from './serializers/csv-serializer';
import { ConfigService } from '@nestjs/config';
import { CoreResult } from 'entities/core-result.entity';

@Injectable()
export class SnapshotService {
  private logger = new Logger(SnapshotService.name);

  constructor(
    private storageService: StorageService,
    private websiteService: WebsiteService,
    private datetimeService: DatetimeService,
    private configService: ConfigService,
  ) {}

  private fileNameLive = this.configService.get<string>('fileNameLive');
  private fileNameAll = this.configService.get<string>('fileNameAll');
  /**
   * weeklySnapshot is meant to be called weekly. It takes three snapshots:
   * - weekly-snapshot-all: contains all Website and CoreResults
   * - weekly-snapshot: contains only Website and CoreResults where
   *   CoreResult.finalUrlIsLive === true
   *
   * If there are existing snapshots, they are copied to the archive bucket, and
   * named as such: <filename>-<date-one-week-previous>.
   *
   * The particular filename is specified by /config/snapshot.config.ts,
   * depending on whichever environment the application is running in.
   */
  async weeklySnapshot() {
    const date = this.datetimeService.now();
    date.setDate(date.getDate() - 7);
    const priorDate = date.toISOString();

    await this.liveSnapshot(priorDate, CoreResult.snapshotColumnOrder);
    await this.allSnapshot(priorDate, CoreResult.snapshotColumnOrder);
  }

  async liveSnapshot(date: string, columns: string[]): Promise<void> {
    let liveWebsites = await this.websiteService.findLiveSnapshotResults();
    this.logger.log(
      `Total number of live websites retrieved for snapshot: ${liveWebsites.length}`,
    );

    const liveSnapshot = new Snapshot(
      this.storageService,
      [new JsonSerializer(columns), new CsvSerializer(columns)],
      liveWebsites,
      date,
      this.fileNameLive,
    );

    await Promise.all([liveSnapshot.archiveExisting(), liveSnapshot.saveNew()]);

    liveWebsites = null;

    this.logger.log('Live snapshot archived and saved.');
  }

  async allSnapshot(date: string, columns: string[]) {
    let allWebsites = await this.websiteService.findAllSnapshotResults();
    this.logger.log(
      `Total number of all websites retrieved for snapshot: ${allWebsites.length}`,
    );

    const allSnapshot = new Snapshot(
      this.storageService,
      [new JsonSerializer(columns), new CsvSerializer(columns)],
      allWebsites,
      date,
      this.fileNameAll,
    );

    await Promise.all([allSnapshot.archiveExisting(), allSnapshot.saveNew()]);

    allWebsites = null;

    this.logger.log('All snapshot archived and saved.');
  }
}
