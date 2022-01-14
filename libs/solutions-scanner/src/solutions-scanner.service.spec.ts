import { BROWSER_TOKEN } from '@app/browser';
import { ScanStatus } from '@app/core-scanner/scan-status';
import { Test, TestingModule } from '@nestjs/testing';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';
import { mock, MockProxy } from 'jest-mock-extended';
import { Browser, Page, Response, Request } from 'puppeteer';
import { SolutionsScannerService } from './solutions-scanner.service';
import { SolutionsInputDto } from './solutions.input.dto';
import { source, testRobotsTxt, testSitemapXml } from './testPageSource';

describe('SolutionsScannerService', () => {
  let service: SolutionsScannerService;
  let mockBrowser: MockProxy<Browser>;
  let mockPage: MockProxy<Page>;
  let mockRobotsPage: MockProxy<Page>;
  let mockSitemapPage: MockProxy<Page>;
  let mockResponse: MockProxy<Response>;
  let mockRobotsResponse: MockProxy<Response>;
  let mockSitemapResponse: MockProxy<Response>;
  let redirectRequest: MockProxy<Request>;

  beforeEach(async () => {
    mockBrowser = mock<Browser>();
    mockPage = mock<Page>();
    mockRobotsPage = mock<Page>();
    mockSitemapPage = mock<Page>();
    mockResponse = mock<Response>();
    mockRobotsResponse = mock<Response>();
    mockSitemapResponse = mock<Response>();
    mockBrowser.newPage.mockResolvedValueOnce(mockPage);
    mockBrowser.newPage.mockResolvedValueOnce(mockRobotsPage);
    mockBrowser.newPage.mockResolvedValueOnce(mockSitemapPage);
    redirectRequest = mock<Request>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SolutionsScannerService,
        {
          provide: BROWSER_TOKEN,
          useValue: mockBrowser,
        },
      ],
    }).compile();

    service = module.get<SolutionsScannerService>(SolutionsScannerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the correct response', async () => {
    const input: SolutionsInputDto = {
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
    const expected = new SolutionsResult();

    expected.website = website;
    expected.usaClasses = 4;
    expected.uswdsString = 1;
    expected.uswdsTables = 0;
    expected.uswdsInlineCss = 0;
    expected.uswdsUsFlag = 20;
    expected.uswdsStringInCss = 0; // :TODO mock this
    expected.uswdsUsFlagInCss = 0; // :TODO mock this
    expected.uswdsMerriweatherFont = 0; // :TODO mock this
    expected.uswdsPublicSansFont = 0; // :TODO mock this
    expected.uswdsSourceSansFont = 0; // :TODO mock this
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

    expected.status = ScanStatus.Completed;

    expect(result).toStrictEqual(expected);
  });
});
