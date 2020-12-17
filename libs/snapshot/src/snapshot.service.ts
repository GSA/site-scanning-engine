import { WebsiteService } from '@app/database/websites/websites.service';
import { LoggerService } from '@app/logger';
import { StorageService } from '@app/storage';
import { Injectable } from '@nestjs/common';
import { SnapshotSaveOptions } from './snapshot-save-options.interface';

@Injectable()
export class SnapshotService {
  constructor(
    private storageService: StorageService,
    private logger: LoggerService,
    private websiteService: WebsiteService,
  ) {}

  async save(options: SnapshotSaveOptions) {
    this.logger.debug('finding all results...');
    const results = await this.websiteService.findAll();
    const serializedResults = results.map((website) => {
      return website.serialized();
    });
    const stringified = JSON.stringify(serializedResults);
    this.logger.debug('writing results...');

    await this.storageService.upload(options.name, stringified);
  }
}
