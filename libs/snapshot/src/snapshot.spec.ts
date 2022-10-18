import { mock, MockProxy } from 'jest-mock-extended';
import { StorageService } from '@app/storage';
import { Logger } from '@nestjs/common';
import { Snapshot } from './snapshot';
import { Website } from 'entities/website.entity';
import { CoreResult } from 'entities/core-result.entity';

describe('Snapshot', () => {
  let mockStorageService: MockProxy<StorageService>;
  let mockLogger: MockProxy<Logger>;

  beforeEach(async () => {
    mockStorageService = mock<StorageService>();
    mockLogger = mock<Logger>();
  });

  it('archivePriorSnapshot', async () => {
    const dateString = new Date().toISOString();
    const website = new Website();
    website.id = 1;
    website.created = dateString;
    website.updated = dateString;
    website.coreResult = new CoreResult();

    const snapshot = new Snapshot(
      mockStorageService,
      mockLogger,
      [website],
      dateString,
      'weekly-snapshot',
    );

    await snapshot.archivePriorSnapshot();

    expect(mockStorageService.copy).toBeCalledWith(
      'weekly-snapshot.json',
      `archive/json/weekly-snapshot-${dateString}.json`,
    );
    expect(mockStorageService.copy).toBeCalledWith(
      'weekly-snapshot.csv',
      `archive/csv/weekly-snapshot-${dateString}.csv`,
    );
  });

  it('saveAsJson', async () => {
    const dateString = new Date().toISOString();
    const website = new Website();
    website.id = 1;
    website.created = dateString;
    website.updated = dateString;
    website.coreResult = new CoreResult();

    const snapshot = new Snapshot(
      mockStorageService,
      mockLogger,
      [website],
      dateString,
      'weekly-snapshot',
    );

    await snapshot.saveAsJson();

    expect(mockStorageService.upload).toBeCalled();
  });

  it('saveAsCsv', async () => {
    const dateString = new Date().toISOString();
    const website = new Website();
    website.id = 1;
    website.created = dateString;
    website.updated = dateString;
    website.coreResult = new CoreResult();

    const snapshot = new Snapshot(
      mockStorageService,
      mockLogger,
      [website],
      dateString,
      'weekly-snapshot',
    );

    await snapshot.saveAsCsv();

    expect(mockStorageService.upload).toBeCalled();
  });
});
