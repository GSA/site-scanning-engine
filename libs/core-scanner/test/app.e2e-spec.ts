import { Test, TestingModule } from '@nestjs/testing';

import { CoreScannerModule, CoreScannerService } from '@app/core-scanner';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { ScanStatus } from '@app/core-scanner/scan-status';

import { CoreResult } from 'entities/core-result.entity';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';

describe('CoreScanner (e2e)', () => {
  let service: CoreScannerService;
  let moduleFixture: TestingModule;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [CoreScannerModule],
    }).compile();

    service = moduleFixture.get<CoreScannerService>(CoreScannerService);
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('returns results for 18f.gov', async () => {
    const input: CoreInputDto = {
      websiteId: 1,
      url: '18f.gov',
      scanId: '123',
    };
    const website = new Website();
    website.id = input.websiteId;

    const expected = new CoreResult();
    expected.finalUrl = 'https://18f.gsa.gov/';
    expected.finalUrlBaseDomain = 'gsa.gov';
    expected.finalUrlIsLive = true;
    expected.finalUrlMIMEType = 'text/html';
    expected.finalUrlSameDomain = false;
    expected.finalUrlSameWebsite = false;
    expected.finalUrlStatusCode = 200;
    expected.status = 'completed';
    expected.targetUrl404Test = true;
    expected.targetUrlBaseDomain = '18f.gov';
    expected.targetUrlRedirects = true;
    expected.website = website;

    const result = await service.scan(input);
    expect(result.coreResult).toStrictEqual(expected);
    //expect(result.solutionsResult).toStrictEqual({});
  });

  it('returns results for poolsafety.gov', async () => {
    const input: CoreInputDto = {
      websiteId: 1,
      url: 'poolsafety.gov',
      scanId: '123',
    };
    const website = new Website();
    website.id = input.websiteId;

    const expected = new CoreResult();
    expected.finalUrl = 'https://www.poolsafely.gov/';
    expected.finalUrlBaseDomain = 'poolsafely.gov';
    expected.finalUrlIsLive = true;
    expected.finalUrlMIMEType = 'text/html';
    expected.finalUrlSameDomain = false;
    expected.finalUrlSameWebsite = false;
    expected.finalUrlStatusCode = 200;
    expected.status = 'completed';
    expected.targetUrl404Test = true;
    expected.targetUrlBaseDomain = 'poolsafety.gov';
    expected.targetUrlRedirects = true;
    expected.website = website;

    const result = await service.scan(input);
    expect(result.coreResult).toStrictEqual(expected);
    //expect(result.solutionsResult).toStrictEqual({});
  });
});

describe('SolutionsScanner (e2e)', () => {
  let service: CoreScannerService;
  let moduleFixture: TestingModule;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [CoreScannerModule],
    }).compile();

    service = moduleFixture.get<CoreScannerService>(CoreScannerService);
  });

  afterAll(async () => {
    //await service.onModuleDestroy();
    await moduleFixture.close();
  });

  it('returns results for a url', async () => {
    const input: CoreInputDto = {
      websiteId: 1,
      url: '18f.gov',
      scanId: '123',
    };
    const website = new Website();
    website.id = input.websiteId;

    const expected = new SolutionsResult();
    expected.website = website;
    expected.usaClasses = 50;
    expected.uswdsString = 1;
    expected.uswdsTables = 0;
    expected.uswdsInlineCss = 0;
    expected.uswdsUsFlag = 20;
    expected.uswdsStringInCss = 20;
    expected.uswdsUsFlagInCss = 0;
    expected.uswdsMerriweatherFont = 5;
    expected.uswdsPublicSansFont = 20;
    expected.uswdsSourceSansFont = 5;
    expected.uswdsSemanticVersion = '2.9.0';
    expected.uswdsVersion = 20;
    expected.uswdsCount = 141;
    expected.status = ScanStatus.Completed;
    expected.dapDetected = true;
    expected.dapParameters = 'agency=GSA&subagency=TTS%2C18F';
    expected.ogTitleFinalUrl = '18F: Digital service delivery | Home';
    expected.ogDescriptionFinalUrl =
      '18F builds effective, user-centric digital services focused on the interaction between government and the people and businesses it serves.';
    expected.ogArticlePublishedFinalUrl = undefined;
    expected.ogArticleModifiedFinalUrl = undefined;
    expected.mainElementFinalUrl = false;
    expected.robotsTxtDetected = true;
    expected.robotsTxtStatusCode = 200;
    expected.robotsTxtFinalUrl = 'https://18f.gsa.gov/robots.txt';
    expected.robotsTxtFinalUrlLive = true;
    expected.robotsTxtFinalUrlMimeType = 'text/plain';
    expected.robotsTxtTargetUrlRedirects = true;
    expected.robotsTxtFinalUrlSize = 65;
    expected.robotsTxtCrawlDelay = undefined;
    expected.robotsTxtSitemapLocations = 'https://18f.gsa.gov/sitemap.xml';
    expected.sitemapXmlDetected = true;
    expected.sitemapXmlStatusCode = 200;
    expected.sitemapXmlFinalUrl = 'https://18f.gsa.gov/sitemap.xml';
    expected.sitemapXmlFinalUrlLive = true;
    expected.sitemapTargetUrlRedirects = true;
    expected.sitemapXmlFinalUrlMimeType = 'application/xml';
    expected.sitemapXmlPdfCount = 0;
    expected.thirdPartyServiceCount = 3;
    expected.thirdPartyServiceDomains =
      'dap.digitalgov.gov,fonts.googleapis.com,www.google-analytics.com';

    const result = await service.scan(input);

    // these values change frequently so just add them to the expected object.
    expected.sitemapXmlFinalUrlFilesize = result.sitemapXmlFinalUrlFilesize;
    expected.sitemapXmlCount = result.sitemapXmlCount;

    expect(result).toStrictEqual(expected);
  });
});
