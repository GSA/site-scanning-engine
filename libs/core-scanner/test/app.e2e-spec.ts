import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';

import { BrowserModule } from '@app/browser';
import { CoreScannerModule, CoreScannerService } from '@app/core-scanner';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { CoreResult } from 'entities/core-result.entity';
import { ScanStatus } from 'entities/scan-status';

describe('CoreScanner (e2e)', () => {
  let service: CoreScannerService;
  let moduleFixture: TestingModule;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [BrowserModule, CoreScannerModule, LoggerModule.forRoot()],
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

    const result = await service.scan(input);
    expect(result).toEqual({
      website: {
        id: 1,
      },
      notFoundScanStatus: 'completed',
      homeScanStatus: 'completed',
      robotsTxtScanStatus: 'completed',
      sitemapXmlScanStatus: 'completed',
      finalUrl: 'https://18f.gsa.gov/',
      finalUrlBaseDomain: 'gsa.gov',
      finalUrlIsLive: true,
      finalUrlMIMEType: 'text/html',
      finalUrlSameDomain: false,
      finalUrlSameWebsite: false,
      finalUrlStatusCode: 200,
      targetUrl404Test: true,
      targetUrlBaseDomain: '18f.gov',
      targetUrlRedirects: true,
      dapDetected: true,
      dapParameters: undefined,
      mainElementFinalUrl: true,
      ogArticleModifiedFinalUrl: undefined,
      ogArticlePublishedFinalUrl: undefined,
      ogDescriptionFinalUrl:
        '18F builds effective, user-centric digital services focused on the interaction between government and the people and businesses it serves.',
      ogTitleFinalUrl: '18F: Digital service delivery | Home',
      robotsTxtCrawlDelay: undefined,
      robotsTxtDetected: true,
      robotsTxtFinalUrl: 'https://18f.gsa.gov/robots.txt',
      robotsTxtFinalUrlLive: true,
      robotsTxtFinalUrlMimeType: 'text/plain',
      robotsTxtFinalUrlSize: 65,
      robotsTxtSitemapLocations: 'https://18f.gsa.gov/sitemap.xml',
      robotsTxtStatusCode: 200,
      robotsTxtTargetUrlRedirects: true,
      sitemapTargetUrlRedirects: true,
      sitemapXmlCount: result.sitemapXml.status === ScanStatus.Completed ? result.sitemapXml.result.sitemapXmlScan.sitemapXmlCount : null, // // This changes often, so ignore non-matches
      sitemapXmlDetected: true,
      sitemapXmlFinalUrl: 'https://18f.gsa.gov/sitemap.xml',
      sitemapXmlFinalUrlFilesize: result.sitemapXml.status === ScanStatus.Completed ? result.sitemapXml.result.sitemapXmlScan.sitemapXmlFinalUrlFilesize : null, // This changes often, so ignore non-matches
      sitemapXmlFinalUrlLive: true,
      sitemapXmlFinalUrlMimeType: 'application/xml',
      sitemapXmlPdfCount: 0,
      sitemapXmlStatusCode: 200,
      thirdPartyServiceCount: 5,
      thirdPartyServiceDomains:
        'dap.digitalgov.gov,fonts.googleapis.com,search.usa.gov,www.google-analytics.com,www.googletagmanager.com',
      usaClasses: 55,
      uswdsCount: 153,
      uswdsInlineCss: 0,
      uswdsMerriweatherFont: 5,
      uswdsPublicSansFont: 20,
      uswdsSemanticVersion: '2.9.0',
      uswdsSourceSansFont: 5,
      uswdsString: 8,
      uswdsStringInCss: 20,
      uswdsTables: 0,
      uswdsUsFlag: 20,
      uswdsUsFlagInCss: 0,
      uswdsVersion: 20,
    });
  });

  it('returns results for poolsafety.gov', async () => {
    const input: CoreInputDto = {
      websiteId: 1,
      url: 'poolsafety.gov',
      scanId: '123',
    };
    

    const result = await service.scan(input);
    expect(result).toEqual({
      website: {
        id: 1,
      },
      homeScanStatus: 'completed',
      notFoundScanStatus: 'completed',
      robotsTxtScanStatus: 'completed',
      sitemapXmlScanStatus: 'completed',
      finalUrl: 'https://www.poolsafely.gov/',
      finalUrlBaseDomain: 'poolsafely.gov',
      finalUrlIsLive: true,
      finalUrlMIMEType: 'text/html',
      finalUrlSameDomain: false,
      finalUrlSameWebsite: false,
      finalUrlStatusCode: 200,
      targetUrl404Test: true,
      targetUrlBaseDomain: 'poolsafety.gov',
      targetUrlRedirects: true,
      dapDetected: true,
      dapParameters: undefined,
      mainElementFinalUrl: false,
      ogArticleModifiedFinalUrl: undefined,
      ogArticlePublishedFinalUrl: undefined,
      ogDescriptionFinalUrl: null,
      ogTitleFinalUrl: 'Pool Safely',
      robotsTxtCrawlDelay: undefined,
      robotsTxtDetected: true,
      robotsTxtFinalUrl: 'https://www.poolsafely.gov/robots.txt',
      robotsTxtFinalUrlLive: true,
      robotsTxtFinalUrlMimeType: 'text/plain',
      robotsTxtFinalUrlSize: 26,
      robotsTxtSitemapLocations: '',
      robotsTxtStatusCode: 200,
      robotsTxtTargetUrlRedirects: true,
      sitemapTargetUrlRedirects: true,
      sitemapXmlCount: 0,
      sitemapXmlDetected: true,
      sitemapXmlFinalUrl: 'https://www.poolsafely.gov/sitemap.xml',
      sitemapXmlFinalUrlFilesize: 26147,
      sitemapXmlFinalUrlLive: true,
      sitemapXmlFinalUrlMimeType: 'text/xml',
      sitemapXmlPdfCount: 0,
      sitemapXmlStatusCode: 200,
      // These two are sensitive to load times - so ignore for e2e purposes
      thirdPartyServiceCount: result.home.status === ScanStatus.Completed ? result.home.result.thirdPartyScan.thirdPartyServiceCount : null,
      thirdPartyServiceDomains: result.home.status === ScanStatus.Completed ? result.home.result.thirdPartyScan.thirdPartyServiceDomains : null,
      usaClasses: 0,
      uswdsCount: 0,
      uswdsInlineCss: 0,
      uswdsMerriweatherFont: 0,
      uswdsPublicSansFont: 0,
      uswdsSemanticVersion: undefined,
      uswdsSourceSansFont: 0,
      uswdsString: 0,
      uswdsStringInCss: 0,
      uswdsTables: 0,
      uswdsUsFlag: 0,
      uswdsUsFlagInCss: 0,
      uswdsVersion: 0,
    });
  });
});
