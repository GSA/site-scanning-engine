import { mock, MockProxy, mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Page, Browser } from 'puppeteer';
import { getLoggerToken, PinoLogger } from 'nestjs-pino';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import pino, { type Logger } from 'pino';

import { BrowserService } from '@app/browser';
import { SecurityDataService } from '@app/security-data';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { CoreScannerService } from './core-scanner.service';
import { stubRedirectedNavigation } from './pages/test-helpers';
import { ScanStatus } from 'entities/scan-status';

jest.mock('libs/core-scanner/src/pages/client-redirect', () => ({
  scanForClientRedirect: jest.fn().mockResolvedValue({
    hasClientRedirect: false,
    usesJsRedirect: false,
    usesMetaRefresh: false,
  }),
}));

describe('CoreScannerService', () => {
  let service: CoreScannerService;
  let mockBrowser: MockProxy<Browser>;
  let mockPage: DeepMockProxy<Page>;
  let mockHttpService: MockProxy<HttpService>;
  let mockLogger: Logger;
  let mockChildLogger: Logger;
  let mockSecurityDataService: MockProxy<SecurityDataService>;
  const finalUrl = 'https://18f.gsa.gov';

  beforeEach(async () => {
    mockBrowser = mock<Browser>();
    mockPage = mockDeep<Page>();
    mockHttpService = mock<HttpService>();
    mockChildLogger = pino();
    mockLogger = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      child: () => mockChildLogger,
      logger: mockChildLogger,
    };
    mockSecurityDataService = mock<SecurityDataService>();

    stubRedirectedNavigation(mockPage, 'text/html; charset=utf-8', finalUrl);
    mockBrowser.newPage.calledWith().mockResolvedValue(mockPage);
    mockSecurityDataService.getSecurityResults
      .calledWith(finalUrl)
      .mockResolvedValue({
        securityScan: {
          httpsEnforced: true,
          hsts: true,
        },
      });

    jest.mock('libs/core-scanner/src/pages/client-redirect');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoreScannerService,
        {
          provide: BrowserService,
          useValue: {
            useBrowser: async (handler) => await handler(mockBrowser),
            processPage: async (page, handler) => await handler(page),
          },
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: SecurityDataService,
          useValue: mockSecurityDataService,
        },
        {
          provide: getLoggerToken(CoreScannerService.name),
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<CoreScannerService>(CoreScannerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a CoreResultPages object with the correct fields', async () => {
    const coreInputDto: CoreInputDto = {
      websiteId: 1,
      url: 'https://18f.gov',
      filter: false,
      pageviews: 1,
      visits: 1,
      scanId: '123',
    };

    const result = await service.scan(coreInputDto);

    expect(result).toHaveProperty('base');
    expect(result).toHaveProperty('notFound');
    expect(result).toHaveProperty('primary');
    expect(result).toHaveProperty('robotsTxt');
    expect(result).toHaveProperty('sitemapXml');
    expect(result).toHaveProperty('dns');
    expect(result).toHaveProperty('accessibility');
    expect(result).toHaveProperty('performance');
    expect(result).toHaveProperty('security');
  });
});
