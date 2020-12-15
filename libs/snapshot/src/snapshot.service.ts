import { WebsiteService } from '@app/database/websites/websites.service';
import { LoggerService } from '@app/logger';
import { StorageService } from '@app/storage';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SnapshotService {
  constructor(
    private storageService: StorageService,
    private loggerService: LoggerService,
    private websiteService: WebsiteService,
  ) {}
}
