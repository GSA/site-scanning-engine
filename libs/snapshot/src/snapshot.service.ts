import { WebsiteService } from '@app/database/websites/websites.service';
import { LoggerService } from '@app/logger';
import { StorageService } from '@app/storage';
import { Injectable } from '@nestjs/common';
import { DatetimeService } from 'libs/datetime/src';
import { Parser, transforms } from 'json2csv';
import { Website } from 'entities/website.entity';

@Injectable()
export class SnapshotService {
  constructor(
    private storageService: StorageService,
    private logger: LoggerService,
    private websiteService: WebsiteService,
    private datetimeService: DatetimeService,
  ) {
    this.logger.setContext(SnapshotService.name);
  }

  /**
   * weeklySnapshot is meant to be called weekly (likely through a CRON job).
   *
   * If there is an existing weekly-snapshot.json and weekly-snapshot.csv it copies it to the
   * archive bucket, and names it weekly-snapshot-<date-one-week-previous>.
   */
  async weeklySnapshot() {
    const date = this.datetimeService.now();
    date.setDate(date.getDate() - 7);

    const newJsonName = `archive/json/weekly-snapshot-${date.toISOString()}.json`;
    const newCsvName = `archive/csv/weekly-snapshot-${date.toISOString()}.csv`;

    this.logger.debug('archiving any exisiting files...');
    await Promise.all([
      await this.archive('weekly-snapshot.json', newJsonName),
      await this.archive('weekly-snapshot.csv', newCsvName),
    ]);

    const results = await this.getResults();
    const jsonData = this.serializeToJson(results);
    const csvData = this.serializeToCsv(results);

    this.logger.debug('saving any new files...');
    await Promise.all([
      this.save('weekly-snapshot.json', jsonData),
      this.save('weekly-snapshot.csv', csvData),
    ]);
  }

  private async getResults(): Promise<Website[]> {
    this.logger.debug('finding all results...');
    const results = await this.websiteService.findAll();
    return results;
  }

  private serializeToJson(results: Website[]): string {
    const serializedResults = results.map((website) => {
      return website.serialized();
    });
    const stringified = JSON.stringify(serializedResults);
    return stringified;
  }

  private serializeToCsv(results: Website[]) {
    const serializedResults = results.map((website) => {
      return website.serialized();
    });
    const parser = new Parser({
      transforms: [
        transforms.flatten({
          objects: true,
          arrays: true,
          separator: '_',
        }),
      ],
    });
    const csv = parser.parse(serializedResults);
    return csv;
  }

  private async save(fileName: string, data: string) {
    await this.storageService.upload(fileName, data);
  }

  private async archive(fileName: string, newName: string) {
    await this.storageService.copy(fileName, newName);
  }
}
