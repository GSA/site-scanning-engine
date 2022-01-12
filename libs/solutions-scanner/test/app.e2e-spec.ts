import { Test, TestingModule } from '@nestjs/testing';
import { noop } from 'lodash';

import { LoggerService } from '@app/logger';
import { ScanStatus } from '@app/core-scanner/scan-status';
import {
  SolutionsScannerModule,
  SolutionsScannerService,
} from '@app/solutions-scanner';
import { SolutionsInputDto } from '@app/solutions-scanner/solutions.input.dto';

import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';

describe('SolutionsScanner (e2e)', () => {
  let service: SolutionsScannerService;
  let moduleFixture: TestingModule;
  let logger: LoggerService;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [SolutionsScannerModule],
    }).compile();

    service = moduleFixture.get<SolutionsScannerService>(
      SolutionsScannerService,
    );
    logger = moduleFixture.get<LoggerService>(LoggerService);

    jest.spyOn(logger, 'debug').mockImplementation(noop);
  });

  afterAll(async () => {
    await service.onModuleDestroy();
    await moduleFixture.close();
  });

  it('returns results for a url', async () => {
    const input: SolutionsInputDto = {
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
