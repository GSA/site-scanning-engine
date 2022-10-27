import { mock, MockProxy } from 'jest-mock-extended';
import { StorageService } from '@app/storage';
import { Snapshot } from './snapshot';
import { Website } from 'entities/website.entity';
import { CoreResult } from 'entities/core-result.entity';
import { JsonSerializer } from './serializers/json-serializer';
import { CsvSerializer } from './serializers/csv-serializer';

describe('Snapshot', () => {
  let mockStorageService: MockProxy<StorageService>;

  beforeEach(async () => {
    mockStorageService = mock<StorageService>();
  });

  it('archives prior snapshot', async () => {
    const dateString = new Date().toISOString();
    const website = new Website();
    website.id = 1;
    website.created = dateString;
    website.updated = dateString;
    website.coreResult = new CoreResult();

    const snapshot = new Snapshot(
      mockStorageService,
      [new JsonSerializer(), new CsvSerializer(Snapshot.CSV_COLUMN_ORDER)],
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

  it('saves new snapshot', async () => {
    const dateString = new Date().toISOString();
    const website = new Website();
    website.id = 1;
    website.created = dateString;
    website.updated = dateString;
    website.coreResult = new CoreResult();

    const snapshot = new Snapshot(
      mockStorageService,
      [new JsonSerializer(), new CsvSerializer(Snapshot.CSV_COLUMN_ORDER)],
      [website],
      dateString,
      'weekly-snapshot',
    );

    await snapshot.saveNewSnapshot();

    expect(mockStorageService.upload).toHaveBeenCalledTimes(2);
  });

  it('specifies the correct column order', () => {
    const expectedColumnOrder = new Set(Snapshot.CSV_COLUMN_ORDER);
    const actualColumnOrder = new Set([
      ...CoreResult.getColumnNames(),
      ...Website.getColumnNames(),
    ]);

    expect(expectedColumnOrder).toEqual(actualColumnOrder);
  });
});
