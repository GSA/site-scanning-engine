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
  private fileNameAccessibility = this.configService.get<string>(
    'fileNameAccessibility',
  );
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

    let liveSnapshot = new Snapshot(
      this.storageService,
      [new JsonSerializer(columns), new CsvSerializer(columns)],
      liveWebsites,
      date,
      this.fileNameLive,
    );

    await liveSnapshot.archiveExisting();
    this.logger.log('Live snapshot archived.');

    await liveSnapshot.saveNew();
    this.logger.log('Live snapshot saved.');

    liveWebsites = null;
    liveSnapshot = null;
  }

  async allSnapshot(date: string, columns: string[]) {
    let allWebsites = await this.websiteService.findAllSnapshotResults();
    this.logger.log(
      `Total number of all websites retrieved for snapshot: ${allWebsites.length}`,
    );

    let allSnapshot = new Snapshot(
      this.storageService,
      [new JsonSerializer(columns), new CsvSerializer(columns)],
      allWebsites,
      date,
      this.fileNameAll,
    );

    await allSnapshot.archiveExisting();
    this.logger.log('All snapshot archived.');

    await allSnapshot.saveNew();
    this.logger.log('All snapshot saved.');

    allWebsites = null;
    allSnapshot = null;
  }

  async accessibilityResultsSnapshot() {
    this.logger.log(
      'Fetching a list of all websites with accessibility details included',
    );
    const websites =
      await this.websiteService.findAccessibilityResultsSnapshotResults();

    this.logger.log('Backing up previous snapshot');
    const date = this.datetimeService.now();
    date.setDate(date.getDate() - 7);
    const priorDate = date.toISOString();
    const newFileName = `archive/json/${this.fileNameAccessibility}-${priorDate}.json`;
    this.storageService.copy(`${this.fileNameAccessibility}.json`, newFileName);

    this.logger.log('Serializing new snapshot');
    const serializedWebsitesWithDetailsOnly = websites.map((website) => {
      return {
        target_url: website.url,
        accessibility_details: website.coreResult.accessibilityResultsList,
      };
    });

    this.logger.log('Uploading new snapshot');
    await this.storageService.upload(
      `${this.fileNameAccessibility}.json`,
      JSON.stringify(serializedWebsitesWithDetailsOnly),
    );
  }
}
