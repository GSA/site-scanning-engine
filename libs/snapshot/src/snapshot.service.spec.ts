import { WebsiteService } from '@app/database/websites/websites.service';
import { StorageService } from '@app/storage';
import { Test, TestingModule } from '@nestjs/testing';
import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { mock, MockProxy } from 'jest-mock-extended';
import { DatetimeService } from 'libs/datetime/src';
import { SnapshotService } from './snapshot.service';

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

    const website = new Website();
    website.coreResult = coreResult;
    website.url = 'supremecourt.gov';

    const fileName = 'weekly-snapshot.json';
    const body = JSON.stringify([website.serialized()]);

    mockWebsiteService.findLiveWebsiteResults.mockResolvedValue([website]);
    mockWebsiteService.findAllWebsiteResults.mockResolvedValue([website]);

    await service.weeklySnapshot();

    copyDate.setDate(copyDate.getDate() - 7);
    const expectedDate = copyDate.toISOString();
    expect(mockStorageService.upload).toBeCalledWith(fileName, body);
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

const MOCK_ROW = {
  id: 3,
  created: '2022-02-25T03:20:07.830Z',
  updated: '2022-02-25T03:20:07.830Z',
  url: 'df.gov',
  branch: 'Federal - Executive',
  agency: 'Central Intelligence Agency',
  agencyCode: null,
  bureau: 'Central Intelligence Agency',
  bureauCode: null,
  coreResult: {
    id: 2,
    created: '2022-02-25T03:21:34.662Z',
    updated: '2022-02-25T03:21:34.662Z',
    notFoundScanStatus: 'unknown_error',
    primaryScanStatus: 'dns_resolution_error',
    robotsTxtScanStatus: 'dns_resolution_error',
    sitemapXmlScanStatus: 'dns_resolution_error',
    notFoundScanStatusDetails: '',
    primaryScanStatusDetails: '{}',
    robotsTxtScanStatusDetails: '{}',
    sitemapXmlScanStatusDetails: '{}',
    targetUrlBaseDomain: 'df.gov',
    finalUrl: null,
    finalUrlIsLive: null,
    finalUrlBaseDomain: null,
    finalUrlMIMEType: null,
    finalUrlSameDomain: null,
    finalUrlStatusCode: null,
    finalUrlSameWebsite: null,
    targetUrl404Test: null,
    targetUrlRedirects: null,
    usaClasses: null,
    uswdsString: null,
    uswdsInlineCss: null,
    uswdsUsFlag: null,
    uswdsStringInCss: null,
    uswdsUsFlagInCss: null,
    uswdsPublicSansFont: null,
    uswdsSemanticVersion: null,
    uswdsVersion: null,
    uswdsCount: null,
    dapDetected: null,
    dapParameters: null,
    ogTitleFinalUrl: null,
    ogDescriptionFinalUrl: null,
    ogArticlePublishedFinalUrl: null,
    ogArticleModifiedFinalUrl: null,
    mainElementFinalUrl: null,
    robotsTxtFinalUrl: null,
    robotsTxtStatusCode: null,
    robotsTxtFinalUrlLive: null,
    robotsTxtDetected: null,
    robotsTxtFinalUrlMimeType: null,
    robotsTxtTargetUrlRedirects: null,
    robotsTxtFinalUrlSize: null,
    robotsTxtCrawlDelay: null,
    robotsTxtSitemapLocations: null,
    sitemapXmlDetected: null,
    sitemapXmlStatusCode: null,
    sitemapXmlFinalUrl: null,
    sitemapXmlFinalUrlLive: null,
    sitemapTargetUrlRedirects: null,
    sitemapXmlFinalUrlFilesize: null,
    sitemapXmlFinalUrlMimeType: null,
    sitemapXmlCount: null,
    sitemapXmlPdfCount: null,
    thirdPartyServiceDomains: null,
    thirdPartyServiceCount: null,
  },
};
