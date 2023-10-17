import { WebsiteService } from '@app/database/websites/websites.service';
import { StorageService } from '@app/storage';
import { Test, TestingModule } from '@nestjs/testing';
import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { mock, MockProxy } from 'jest-mock-extended';
import { DatetimeService } from 'libs/datetime/src';
import { SnapshotService } from './snapshot.service';
import { ConfigService } from '@nestjs/config';

describe('SnapshotService', () => {
  let service: SnapshotService;
  let module: TestingModule;
  let mockStorageService: MockProxy<StorageService>;
  let mockWebsiteService: MockProxy<WebsiteService>;
  let mockDatetimeService: MockProxy<DatetimeService>;

  beforeEach(async () => {
    mockStorageService = mock<StorageService>();
    mockWebsiteService = mock<WebsiteService>();
    mockDatetimeService = mock<DatetimeService>();

    module = await Test.createTestingModule({
      providers: [
        SnapshotService,
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: WebsiteService,
          useValue: mockWebsiteService,
        },
        {
          provide: DatetimeService,
          useValue: mockDatetimeService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'fileNameLive') {
                return 'weekly-snapshot';
              }

              if (key === 'fileNameAll') {
                return 'weekly-snapshot-all';
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SnapshotService>(SnapshotService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should serialize the database results to JSON and save in Storage', async () => {
    const coreResult = new CoreResult();
    const date = new Date();
    const copyDate = new Date(date);
    mockDatetimeService.now.mockReturnValue(date);

    coreResult.finalUrlIsLive = true;
    coreResult.primaryScanStatus = 'completed';
    coreResult.robotsTxtScanStatus = 'completed';
    coreResult.sitemapXmlScanStatus = 'completed';
    coreResult.finalUrlMIMEType = 'text/html';

    const website = new Website();
    website.coreResult = coreResult;
    website.url = 'supremecourt.gov';

    mockWebsiteService.findLiveSnapshotResults.mockResolvedValue([website]);
    mockWebsiteService.findAllSnapshotResults.mockResolvedValue([website]);

    await service.weeklySnapshot();

    copyDate.setDate(copyDate.getDate() - 7);
    const expectedDate = copyDate.toISOString();

    expect(mockStorageService.copy).toBeCalledTimes(4);

    expect(mockStorageService.copy).toBeCalledWith(
      'weekly-snapshot.json',
      `archive/json/weekly-snapshot-${expectedDate}.json`,
    );

    expect(mockStorageService.copy).toBeCalledWith(
      'weekly-snapshot.csv',
      `archive/csv/weekly-snapshot-${expectedDate}.csv`,
    );

    expect(mockStorageService.copy).toBeCalledWith(
      'weekly-snapshot-all.json',
      `archive/json/weekly-snapshot-all-${expectedDate}.json`,
    );

    expect(mockStorageService.copy).toBeCalledWith(
      'weekly-snapshot-all.csv',
      `archive/csv/weekly-snapshot-all-${expectedDate}.csv`,
    );
  });
});
