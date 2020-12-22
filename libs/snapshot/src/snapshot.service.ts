import { WebsiteService } from '@app/database/websites/websites.service';
import { LoggerService } from '@app/logger';
import { StorageService } from '@app/storage';
import { Injectable } from '@nestjs/common';
import { DatetimeService } from 'libs/datetime/src';
import { SnapshotSaveOptions } from './snapshot-save-options.interface';

@Injectable()
export class SnapshotService {
  constructor(
    private storageService: StorageService,
    private logger: LoggerService,
    private websiteService: WebsiteService,
    private datetimeService: DatetimeService,
  ) {}

  /**
   * weeklySnapshot is meant to be called weekly (likely through a CRON job).
   *
   * If there is an existing weekly-snapshot.json and weekly-snapshot.csv it copies it to the
   * archive bucket, and names it weekly-snapshot-<date-one-week-previous>.
   */
  async weeklySnapshot() {
    const date = this.datetimeService.now();
    date.setDate(date.getDate() - 7);

    const newJsonName = `archive/weekly-snapshot-${date.toISOString()}.json`;

    this.logger.debug('archiving any exisiting files...');
    await this.archive('weekly-snapshot.json', newJsonName);

    this.logger.debug('saving any new files...');
    await this.save({
      name: 'weekly-snapshot.json',
    });
  }

  private async save(options: SnapshotSaveOptions) {
    this.logger.debug('finding all results...');
    const results = await this.websiteService.findAll();
    const serializedResults = results.map((website) => {
      return website.serialized();
    });
    const stringified = JSON.stringify(serializedResults);
    this.logger.debug('writing results...');

    await this.storageService.upload(options.name, stringified);
  }

  private async archive(fileName: string, newName: string) {
    await this.storageService.copy(fileName, newName);
  }
}
