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
              if (key === 'fileNameDailyLive') {
                return 'site-scanning-live-filtered-latest';
              }
              if (key === 'fileNameDailyUnique') {
                return 'site-scanning-live-filtered-unique-latest';
              }
              if (key === 'fileNameDailyAll') {
                return 'site-scanning-latest';
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

  it('should serialize the database results and save in Storage', async () => {
    const coreResult = new CoreResult();

    coreResult.finalUrlIsLive = true;
    coreResult.primaryScanStatus = 'completed';
    coreResult.robotsTxtScanStatus = 'completed';
    coreResult.sitemapXmlScanStatus = 'completed';
    coreResult.finalUrlMIMEType = 'text/html';

    const website = new Website();
    website.coreResult = coreResult;
    website.url = 'supremecourt.gov';

    mockWebsiteService.findLiveSnapshotResults.mockResolvedValue([website]);
    mockWebsiteService.findUniqueSnapshotResults.mockResolvedValue([website]);
    mockWebsiteService.findAllSnapshotResults.mockResolvedValue([website]);

    mockStorageService.exists.mockResolvedValue(true);

    const fixedDate = new Date('2026-02-20T00:00:00.000Z');
    mockDatetimeService.now.mockReturnValue(new Date(fixedDate));

    const yesterday = new Date(fixedDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const expectedDate = yesterday.toISOString().split('T')[0];

    await service.dailySnapshot();

    const expectedCopyCalls = [
      // live filtered (JSON)
      [
        'site-scanning-live-filtered-previous.json',
        `archive/json/site-scanning-live-filtered-${expectedDate}.json`,
      ],
      [
        'site-scanning-live-filtered-latest.json',
        'site-scanning-live-filtered-previous.json',
      ],
      // live filtered (CSV)
      [
        'site-scanning-live-filtered-previous.csv',
        `archive/csv/site-scanning-live-filtered-${expectedDate}.csv`,
      ],
      [
        'site-scanning-live-filtered-latest.csv',
        'site-scanning-live-filtered-previous.csv',
      ],
      // live filtered unique (JSON)
      [
        'site-scanning-live-filtered-unique-previous.json',
        `archive/json/site-scanning-live-filtered-unique-${expectedDate}.json`,
      ],
      [
        'site-scanning-live-filtered-unique-latest.json',
        'site-scanning-live-filtered-unique-previous.json',
      ],
      // live filtered unique (CSV)
      [
        'site-scanning-live-filtered-unique-previous.csv',
        `archive/csv/site-scanning-live-filtered-unique-${expectedDate}.csv`,
      ],
      [
        'site-scanning-live-filtered-unique-latest.csv',
        'site-scanning-live-filtered-unique-previous.csv',
      ],
      // all (JSON)
      [
        'site-scanning-previous.json',
        `archive/json/site-scanning-${expectedDate}.json`,
      ],
      ['site-scanning-latest.json', 'site-scanning-previous.json'],
      // all (CSV)
      [
        'site-scanning-previous.csv',
        `archive/csv/site-scanning-${expectedDate}.csv`,
      ],
      ['site-scanning-latest.csv', 'site-scanning-previous.csv'],
    ];

    const expectedUploadCalls = [
      ['site-scanning-live-filtered-latest.json', expect.anything()],
      ['site-scanning-live-filtered-latest.csv', expect.anything()],
      ['site-scanning-live-filtered-unique-latest.json', expect.anything()],
      ['site-scanning-live-filtered-unique-latest.csv', expect.anything()],
      ['site-scanning-latest.json', expect.anything()],
      ['site-scanning-latest.csv', expect.anything()],
    ];

    expect(mockStorageService.copy).toHaveBeenCalledTimes(
      expectedCopyCalls.length,
    );
    expect(mockStorageService.copy.mock.calls).toEqual(
      expect.arrayContaining(expectedCopyCalls),
    );

    expect(mockStorageService.upload).toHaveBeenCalledTimes(
      expectedUploadCalls.length,
    );
    expect(mockStorageService.upload.mock.calls).toEqual(
      expect.arrayContaining(expectedUploadCalls),
    );
  });
});
