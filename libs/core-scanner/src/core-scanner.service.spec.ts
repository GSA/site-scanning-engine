import { mock, MockProxy } from 'jest-mock-extended';
import { Page, HTTPResponse, HTTPRequest, Browser } from 'puppeteer';
import { getLoggerToken, PinoLogger } from 'nestjs-pino';
import { of } from 'rxjs';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';

import { BrowserModule, BrowserService } from '@app/browser';
import { PUPPETEER_TOKEN } from '@app/browser/puppeteer.service';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';

import { CoreResult } from 'entities/core-result.entity';
import { ScanStatus } from 'entities/scan-status';
import { Website } from 'entities/website.entity';

import { CoreScannerService } from './core-scanner.service';
import {
  source,
  testRobotsTxt,
  testSitemapXml,
} from './pages/test-page-source';

xdescribe('CoreScannerService', () => {
  let service: CoreScannerService;
  let mockBrowser: MockProxy<Browser>;
  let mockPage: MockProxy<Page>;
  let mockResponse: MockProxy<HTTPResponse>;
  let mockRequest: MockProxy<HTTPRequest>;
  let redirectRequest: MockProxy<HTTPRequest>;
  let mockHttpService: MockProxy<HttpService>;
  const finalUrl = 'https://18f.gsa.gov';

  beforeEach(async () => {
    mockBrowser = mock<Browser>();
    mockPage = mock<Page>();
    mockResponse = mock<HTTPResponse>();
    mockRequest = mock<HTTPRequest>();
    redirectRequest = mock<HTTPRequest>();
    mockHttpService = mock<HttpService>();

    redirectRequest.url.calledWith().mockReturnValue('https://18f.gov');
    mockRequest.redirectChain.calledWith().mockReturnValue([redirectRequest]);
    mockResponse.request.calledWith().mockReturnValue(mockRequest);
    mockResponse.status.calledWith().mockReturnValue(200);
    mockResponse.headers.calledWith().mockReturnValue({
      'Content-Type': 'text/html; charset=utf-8',
    });
    mockPage.goto.calledWith('https://18f.gov').mockResolvedValue(mockResponse);
    mockPage.url.calledWith().mockReturnValue(finalUrl);
    mockBrowser.newPage.calledWith().mockResolvedValue(mockPage);

    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, BrowserModule],
      providers: [
        CoreScannerService,
        BrowserService,
        {
          provide: PUPPETEER_TOKEN,
          useValue: {
            useBrowser: (handler) => handler(mockBrowser),
          },
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: getLoggerToken(CoreScannerService.name),
          useValue: mock<PinoLogger>(),
        },
      ],
    }).compile();

    service = module.get<CoreScannerService>(CoreScannerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a CoreResult with the correct fields', async () => {
    const coreInputDto: CoreInputDto = {
      websiteId: 1,
      url: 'https://18f.gov',
      scanId: '123',
    };

    mockHttpService.get.mockImplementationOnce(() => {
      return of({
        data: {},
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {},
      });
    });

    const website = new Website();
    website.id = coreInputDto.websiteId;

    const result = await service.scan(coreInputDto);
    const expected = new CoreResult();
    expected.notFoundScanStatus = ScanStatus.Completed;
    expected.primaryScanStatus = ScanStatus.Completed;
    expected.robotsTxtScanStatus = ScanStatus.Completed;
    expected.sitemapXmlScanStatus = ScanStatus.Completed;
    expected.finalUrl = 'https://18f.gsa.gov/';
    expected.finalUrlBaseDomain = 'gsa.gov';
    expected.finalUrlIsLive = true;
    expected.finalUrlMIMEType = 'text/html';
    expected.finalUrlSameDomain = false;
    expected.finalUrlSameWebsite = false;
    expected.finalUrlStatusCode = 200;
    expected.targetUrlBaseDomain = '18f.gov';
    expected.targetUrlRedirects = true;
    expected.website = website;
    expected.targetUrl404Test = true;

    expect(result).toEqual(expected);
  });
});

xdescribe('SolutionsScannerService', () => {
  let service: CoreScannerService;
  let mockBrowser: MockProxy<Browser>;
  let mockPage: MockProxy<Page>;
  let mockRobotsPage: MockProxy<Page>;
  let mockSitemapPage: MockProxy<Page>;
  let mockResponse: MockProxy<HTTPResponse>;
  let mockRobotsResponse: MockProxy<HTTPResponse>;
  let mockSitemapResponse: MockProxy<HTTPResponse>;
  let redirectRequest: MockProxy<HTTPRequest>;
  let mockHttpService: MockProxy<HttpService>;

  beforeEach(async () => {
    mockBrowser = mock<Browser>();
    mockPage = mock<Page>();
    mockRobotsPage = mock<Page>();
    mockSitemapPage = mock<Page>();
    mockResponse = mock<HTTPResponse>();
    mockRobotsResponse = mock<HTTPResponse>();
    mockSitemapResponse = mock<HTTPResponse>();
    mockBrowser.newPage.calledWith().mockResolvedValue(mockPage);
    mockBrowser.newPage.calledWith().mockResolvedValue(mockRobotsPage);
    mockBrowser.newPage.calledWith().mockResolvedValue(mockSitemapPage);
    redirectRequest = mock<HTTPRequest>();
    mockHttpService = mock<HttpService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoreScannerService,
        BrowserService,
        {
          provide: PUPPETEER_TOKEN,
          useValue: {
            useBrowser: (handler) => handler(mockBrowser),
          },
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<CoreScannerService>(CoreScannerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the correct response', async () => {
    const input: CoreInputDto = {
      websiteId: 1,
      url: '18f.gov',
      scanId: '123',
    };

    const time = new Date('2018-09-15T15:53:00');

    const website = new Website();
    website.id = input.websiteId;

    mockPage.evaluate.mockResolvedValueOnce(4);
    mockPage.evaluate.mockResolvedValueOnce('Page Title');
    mockPage.evaluate.mockResolvedValueOnce('Page Description');
    mockPage.evaluate.mockResolvedValueOnce(time.toString());
    mockPage.evaluate.mockResolvedValueOnce(time.toString());
    mockPage.evaluate.mockResolvedValueOnce(true);

    mockResponse.text.mockResolvedValue(source);
    mockResponse.url.mockReturnValue('https://18f.gsa.gov');
    mockPage.goto.mockResolvedValue(mockResponse);
    redirectRequest.redirectChain.mockReturnValue([]);

    // Robots setup
    mockRobotsResponse.url.mockReturnValue('https://18f.gsa.gov/robots.txt');
    mockRobotsResponse.status.mockReturnValue(200);
    mockRobotsResponse.request.mockReturnValue(redirectRequest);
    mockRobotsResponse.text.mockResolvedValue(testRobotsTxt);
    mockRobotsResponse.headers.calledWith().mockReturnValue({
      'Content-Type': 'text/plain; charset=utf-8',
    });
    mockRobotsPage.goto.mockResolvedValue(mockRobotsResponse);

    // sitemap setup
    mockSitemapResponse.url.mockReturnValue('https://18f.gsa.gov/sitemap.xml');
    mockSitemapResponse.status.mockReturnValue(200);
    mockSitemapResponse.request.mockReturnValue(redirectRequest);
    mockSitemapResponse.text.mockResolvedValue(testSitemapXml);
    mockSitemapResponse.headers.calledWith().mockReturnValue({
      'Content-Type': 'application/xml; charset=utf-8',
    });
    mockSitemapPage.goto.mockResolvedValue(mockSitemapResponse);
    mockSitemapPage.evaluate.mockResolvedValueOnce(200);

    const result = await service.scan(input);
    const expected = new CoreResult();

    expected.website = website;
    expected.usaClasses = 4;
    expected.uswdsString = 1;
    expected.uswdsInlineCss = 0;
    expected.uswdsUsFlag = 20;
    expected.uswdsStringInCss = 0; // :TODO mock this
    expected.uswdsUsFlagInCss = 0; // :TODO mock this
    expected.uswdsPublicSansFont = 0; // :TODO mock this
    expected.uswdsCount = 25;
    expected.uswdsSemanticVersion = undefined;
    expected.uswdsVersion = 0;
    expected.dapDetected = false;
    expected.dapParameters = undefined;
    expected.ogTitleFinalUrl = 'Page Title';
    expected.ogDescriptionFinalUrl = 'Page Description';
    expected.ogArticlePublishedFinalUrl = time;
    expected.ogArticleModifiedFinalUrl = time;
    expected.mainElementFinalUrl = true;
    expected.robotsTxtDetected = true;
    expected.robotsTxtFinalUrl = 'https://18f.gsa.gov/robots.txt';
    expected.robotsTxtStatusCode = 200;
    expected.robotsTxtFinalUrlLive = true;
    expected.robotsTxtFinalUrlMimeType = 'text/plain';
    expected.robotsTxtTargetUrlRedirects = false;
    expected.robotsTxtFinalUrlSize = 125;
    expected.robotsTxtCrawlDelay = 10;
    expected.robotsTxtSitemapLocations =
      'https://18f.gsa.gov/sitemap1.xml,https://18f.gsa.gov/sitemap2.xml';
    expected.sitemapXmlFinalUrl = 'https://18f.gsa.gov/sitemap.xml';
    expected.sitemapXmlStatusCode = 200;
    expected.sitemapXmlDetected = true;
    expected.sitemapXmlFinalUrlLive = true;
    expected.sitemapTargetUrlRedirects = false;
    expected.sitemapXmlFinalUrlFilesize = 95060;
    expected.sitemapXmlFinalUrlMimeType = 'application/xml';
    expected.sitemapXmlCount = 200;
    expected.sitemapXmlPdfCount = 0;
    expected.thirdPartyServiceDomains = '';
    expected.thirdPartyServiceCount = 0;

    expected.notFoundScanStatus = ScanStatus.Completed;
    expected.primaryScanStatus = ScanStatus.Completed;
    expected.robotsTxtScanStatus = ScanStatus.Completed;
    expected.sitemapXmlScanStatus = ScanStatus.Completed;

    expect(result).toEqual(expected);
  });
});
