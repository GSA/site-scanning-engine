import { mock, MockProxy } from 'jest-mock-extended';
import { StorageService } from '@app/storage';
import { Snapshot } from './snapshot';
import { Website } from 'entities/website.entity';
import { CoreResult } from 'entities/core-result.entity';
import { JsonSerializer } from './serializers/json-serializer';
import { CsvSerializer } from './serializers/csv-serializer';

describe('Snapshot', () => {
  let mockStorageService: MockProxy<StorageService>;
  let dateString: string;
  let website: Website;

  beforeEach(async () => {
    mockStorageService = mock<StorageService>();
    dateString = new Date().toISOString();
    website = new Website();
    website.id = 1;
    website.created = dateString;
    website.updated = dateString;
    website.coreResult = new CoreResult();
  });

  describe('archiveDaily', () => {
    let snapshot: Snapshot;

    beforeEach(() => {
      snapshot = new Snapshot(
        mockStorageService,
        [
          new JsonSerializer(CoreResult.snapshotColumnOrder),
          new CsvSerializer(CoreResult.snapshotColumnOrder),
        ],
        [website],
        dateString,
        'site-scanning-latest',
      );
    });

    it('archives and rotates when both latest and previous files exist', async () => {
      mockStorageService.exists.mockResolvedValue(true);

      await snapshot.archiveDaily();

      expect(mockStorageService.copy).toHaveBeenCalledTimes(4);

      expect(mockStorageService.copy).toHaveBeenCalledWith(
        'site-scanning-previous.json',
        `archive/json/site-scanning-${dateString}.json`,
      );
      expect(mockStorageService.copy).toHaveBeenCalledWith(
        'site-scanning-latest.json',
        'site-scanning-previous.json',
      );
      expect(mockStorageService.copy).toHaveBeenCalledWith(
        'site-scanning-previous.csv',
        `archive/csv/site-scanning-${dateString}.csv`,
      );
      expect(mockStorageService.copy).toHaveBeenCalledWith(
        'site-scanning-latest.csv',
        'site-scanning-previous.csv',
      );
    });

    it('skips archive copy but still rotates latest to previous on first run', async () => {
      mockStorageService.exists.mockImplementation((objectName: string) => {
        const existingFiles = [
          'site-scanning-latest.json',
          'site-scanning-latest.csv',
        ];
        return Promise.resolve(existingFiles.includes(objectName));
      });

      await snapshot.archiveDaily();

      expect(mockStorageService.copy).toHaveBeenCalledTimes(2);
      expect(mockStorageService.copy).toHaveBeenCalledWith(
        'site-scanning-latest.json',
        'site-scanning-previous.json',
      );
      expect(mockStorageService.copy).toHaveBeenCalledWith(
        'site-scanning-latest.csv',
        'site-scanning-previous.csv',
      );
    });

    it('skips rotation if latest file does not exist', async () => {
      mockStorageService.exists.mockResolvedValue(false);

      await snapshot.archiveDaily();

      expect(mockStorageService.copy).not.toHaveBeenCalled();
    });
  });

  it('saves new snapshot', async () => {
    const snapshot = new Snapshot(
      mockStorageService,
      [
        new JsonSerializer(CoreResult.snapshotColumnOrder),
        new CsvSerializer(CoreResult.snapshotColumnOrder),
      ],
      [website],
      dateString,
      'site-scanning-latest',
    );

    await snapshot.saveNew();

    expect(mockStorageService.upload).toHaveBeenCalledTimes(2);
    expect(mockStorageService.upload).toHaveBeenCalledWith(
      'site-scanning-latest.json',
      expect.anything(),
    );
    expect(mockStorageService.upload).toHaveBeenCalledWith(
      'site-scanning-latest.csv',
      expect.anything(),
    );
  });
});
