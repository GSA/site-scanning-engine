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
      base: {
        targetUrlBaseDomain: input.url,
      },
      primary: {
        error: null,
        result: {
          dapScan: {
            dapDetected: true,
            dapParameters:
              result.primary.status === ScanStatus.Completed
                ? result.primary.result.dapScan.dapParameters
                : undefined, // need to fix this eventually
          },
          loginScan: {
            loginDetected: null,
          },
          seoScan: {
            mainElementFinalUrl: true,
            ogArticleModifiedFinalUrl: undefined,
            ogArticlePublishedFinalUrl: undefined,
            ogDescriptionFinalUrl:
              '18F builds effective, user-centric digital services focused on the interaction between government and the people and businesses it serves.',
            ogTitleFinalUrl: '18F: Digital service delivery | Home',
          },
          thirdPartyScan: {
            thirdPartyServiceCount: 5,
            thirdPartyServiceDomains:
              result.primary.status === ScanStatus.Completed
                ? result.primary.result.thirdPartyScan.thirdPartyServiceDomains
                : undefined, // need to fix this eventually
          },
          urlScan: {
            finalUrl: 'https://18f.gsa.gov/',
            finalUrlBaseDomain: 'gsa.gov',
            finalUrlIsLive: true,
            finalUrlMIMEType: 'text/html',
            finalUrlSameDomain: false,
            finalUrlSameWebsite: false,
            finalUrlStatusCode: 200,
            targetUrlRedirects: true,
          },
          uswdsScan: {
            usaClasses: 55,
            uswdsCount: 153,
            uswdsInlineCss: 0,
            uswdsPublicSansFont: 40,
            uswdsSemanticVersion: '2.9.0',
            uswdsString: 8,
            uswdsStringInCss: 20,
            uswdsUsFlag: 20,
            uswdsUsFlagInCss: 0,
            uswdsVersion: 100,
          },
        },
        status: ScanStatus.Completed,
      },
      dns: {
        error: null,
        result: {
          dnsScan: {
            ipv6: true,
          },
        },
        status: ScanStatus.Completed,
      },
      notFound: {
        error: null,
        result: {
          notFoundScan: {
            targetUrl404Test: true,
          },
        },
        status: ScanStatus.Completed,
      },
      robotsTxt: {
        error: null,
        result: {
          robotsTxtScan: {
            robotsTxtCrawlDelay: null,
            robotsTxtDetected: true,
            robotsTxtFinalUrl: 'https://18f.gsa.gov/robots.txt',
            robotsTxtFinalUrlLive: true,
            robotsTxtFinalUrlMimeType: 'text/plain',
            robotsTxtFinalUrlSize: 65,
            robotsTxtSitemapLocations: 'https://18f.gsa.gov/sitemap.xml',
            robotsTxtStatusCode: 200,
            robotsTxtTargetUrlRedirects: true,
          },
        },
        status: ScanStatus.Completed,
      },
      sitemapXml: {
        error: null,
        result: {
          sitemapXmlScan: {
            sitemapTargetUrlRedirects: true,
            sitemapXmlCount: 720,
            sitemapXmlDetected: true,
            sitemapXmlFinalUrl: 'https://18f.gsa.gov/sitemap.xml',
            sitemapXmlFinalUrlFilesize: 100394,
            sitemapXmlFinalUrlLive: true,
            sitemapXmlFinalUrlMimeType: 'application/xml',
            sitemapXmlPdfCount: 0,
            sitemapXmlStatusCode: 200,
          },
        },
        status: ScanStatus.Completed,
      },
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
      base: {
        targetUrlBaseDomain: input.url,
      },
      dns: {
        error: null,
        result: {
          dnsScan: {
            ipv6: true,
          },
        },
        status: ScanStatus.Completed,
      },
      primary: {
        error: null,
        result: {
          dapScan: {
            dapDetected: true,
            dapParameters:
              result.primary.status === ScanStatus.Completed
                ? result.primary.result.dapScan.dapParameters
                : undefined, // need to fix this eventually
          },
          loginScan: {
            loginDetected: null,
          },
          seoScan: {
            mainElementFinalUrl: false,
            ogArticleModifiedFinalUrl: undefined,
            ogArticlePublishedFinalUrl: undefined,
            ogDescriptionFinalUrl: null,
            ogTitleFinalUrl: 'Pool Safely',
          },
          thirdPartyScan: {
            thirdPartyServiceCount: 12,
            thirdPartyServiceDomains:
              result.primary.status === ScanStatus.Completed
                ? result.primary.result.thirdPartyScan.thirdPartyServiceDomains
                : undefined, // need to fix this eventually
          },
          urlScan: {
            finalUrl: 'https://www.poolsafely.gov/',
            finalUrlBaseDomain: 'poolsafely.gov',
            finalUrlIsLive: true,
            finalUrlMIMEType: 'text/html',
            finalUrlSameDomain: false,
            finalUrlSameWebsite: false,
            finalUrlStatusCode: 200,
            targetUrlRedirects: true,
          },
          uswdsScan: {
            usaClasses: 0,
            uswdsCount: 0,
            uswdsInlineCss: 0,
            uswdsPublicSansFont: 0,
            uswdsSemanticVersion: undefined,
            uswdsString: 0,
            uswdsStringInCss: 0,
            uswdsUsFlag: 0,
            uswdsUsFlagInCss: 0,
            uswdsVersion: 0,
          },
        },
        status: ScanStatus.Completed,
      },
      notFound: {
        error: null,
        result: {
          notFoundScan: {
            targetUrl404Test: true,
          },
        },
        status: ScanStatus.Completed,
      },
      robotsTxt: {
        error: null,
        result: {
          robotsTxtScan: {
            robotsTxtCrawlDelay: null,
            robotsTxtDetected: true,
            robotsTxtFinalUrl: 'https://www.poolsafely.gov/robots.txt',
            robotsTxtFinalUrlLive: true,
            robotsTxtFinalUrlMimeType: 'text/plain',
            robotsTxtFinalUrlSize: 170,
            robotsTxtSitemapLocations: 'https://www.poolsafely.gov/sitemap.xml',
            robotsTxtStatusCode: 200,
            robotsTxtTargetUrlRedirects: true,
          },
        },
        status: ScanStatus.Completed,
      },
      sitemapXml: {
        error: null,
        result: {
          sitemapXmlScan: {
            sitemapTargetUrlRedirects: true,
            sitemapXmlCount: 0,
            sitemapXmlDetected: true,
            sitemapXmlFinalUrl: 'https://www.poolsafely.gov/sitemap.xml',
            sitemapXmlFinalUrlFilesize: 26500,
            sitemapXmlFinalUrlLive: true,
            sitemapXmlFinalUrlMimeType: 'text/xml',
            sitemapXmlPdfCount: 0,
            sitemapXmlStatusCode: 200,
          },
        },
        status: ScanStatus.Completed,
      },
    });
  });
});
