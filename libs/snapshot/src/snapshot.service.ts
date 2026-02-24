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

  private fileNameDailyLive =
    this.configService.get<string>('fileNameDailyLive');
  private fileNameDailyLiveFiltered = this.configService.get<string>(
    'fileNameDailyLiveFiltered',
  );
  private fileNameDailyLiveFilteredUnique = this.configService.get<string>(
    'fileNameDailyLiveFilteredUnique',
  );
  private fileNameDailyAll = this.configService.get<string>('fileNameDailyAll');
  private fileNameAccessibility = this.configService.get<string>(
    'fileNameAccessibility',
  );

  async dailySnapshot() {
    const date = this.datetimeService.now();
    date.setDate(date.getDate() - 1);
    const yesterday = date.toISOString().split('T')[0];

    await this.liveSnapshot(
      yesterday,
      CoreResult.snapshotColumnOrder,
      this.fileNameDailyLive,
    );
    await this.liveFilteredSnapshot(
      yesterday,
      CoreResult.snapshotColumnOrder,
      this.fileNameDailyLiveFiltered,
    );
    await this.liveFilteredUniqueSnapshot(
      yesterday,
      CoreResult.snapshotColumnOrder,
      this.fileNameDailyLiveFilteredUnique,
    );
    await this.allSnapshot(
      yesterday,
      CoreResult.snapshotColumnOrder,
      this.fileNameDailyAll,
    );
  }

  async liveSnapshot(
    date: string,
    columns: string[],
    fileName: string,
  ): Promise<void> {
    let liveWebsites = await this.websiteService.findLiveSnapshotResults();
    this.logger.log(
      `Total number of live websites retrieved for live snapshot: ${liveWebsites.length}`,
    );

    let liveSnapshot = new Snapshot(
      this.storageService,
      [new JsonSerializer(columns), new CsvSerializer(columns)],
      liveWebsites,
      date,
      fileName,
    );

    await liveSnapshot.archiveDaily();
    this.logger.log('Live snapshot archived.');

    await liveSnapshot.saveNew();
    this.logger.log('Live snapshot saved.');

    liveWebsites = null;
    liveSnapshot = null;
  }

  async liveFilteredSnapshot(
    date: string,
    columns: string[],
    fileName: string,
  ): Promise<void> {
    let liveFilteredWebsites =
      await this.websiteService.findLiveFilteredSnapshotResults();
    this.logger.log(
      `Total number of live websites retrieved for live filtered snapshot: ${liveFilteredWebsites.length}`,
    );

    let liveFilteredSnapshot = new Snapshot(
      this.storageService,
      [new JsonSerializer(columns), new CsvSerializer(columns)],
      liveFilteredWebsites,
      date,
      fileName,
    );

    await liveFilteredSnapshot.archiveDaily();
    this.logger.log('Live filtered snapshot archived.');

    await liveFilteredSnapshot.saveNew();
    this.logger.log('Live filtered snapshot saved.');

    liveFilteredWebsites = null;
    liveFilteredSnapshot = null;
  }

  async liveFilteredUniqueSnapshot(
    date: string,
    columns: string[],
    filename: string,
  ): Promise<void> {
    let liveFilteredUniqueWebsites =
      await this.websiteService.findLiveFilteredUniqueSnapshotResults();
    this.logger.log(
      `Total number of live filtered unique websites retrieved for snapshot: ${liveFilteredUniqueWebsites.length}`,
    );

    let liveFilteredUniqueSnapshot = new Snapshot(
      this.storageService,
      [new JsonSerializer(columns), new CsvSerializer(columns)],
      liveFilteredUniqueWebsites,
      date,
      filename,
    );

    await liveFilteredUniqueSnapshot.archiveDaily();
    this.logger.log('Live filtered unique snapshot archived.');

    await liveFilteredUniqueSnapshot.saveNew();
    this.logger.log('Live filtered unique snapshot saved.');

    liveFilteredUniqueWebsites = null;
    liveFilteredUniqueSnapshot = null;
  }

  async allSnapshot(date: string, columns: string[], filename: string) {
    let allWebsites = await this.websiteService.findAllSnapshotResults();
    this.logger.log(
      `Total number of all websites retrieved for snapshot: ${allWebsites.length}`,
    );

    let allSnapshot = new Snapshot(
      this.storageService,
      [new JsonSerializer(columns), new CsvSerializer(columns)],
      allWebsites,
      date,
      filename,
    );

    await allSnapshot.archiveDaily();
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
        accessibility_details: JSON.parse(
          website.coreResult.accessibilityResultsList,
        ),
      };
    });

    this.logger.log(
      `Uploading new snapshot to S3 as ${this.fileNameAccessibility}.json`,
    );
    await this.storageService.upload(
      `${this.fileNameAccessibility}.json`,
      JSON.stringify(serializedWebsitesWithDetailsOnly, null, 2),
    );
  }
}
