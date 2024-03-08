import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { mock, mockReset } from 'jest-mock-extended';
import { Repository } from 'typeorm';
import { CoreResultService } from './core-result.service';
import { Logger } from '@nestjs/common';
import { ScanStatus } from 'entities/scan-status';

describe('CoreResultService', () => {
  let service: CoreResultService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = mock<Repository<CoreResult>>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoreResultService,
        {
          provide: getRepositoryToken(CoreResult),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CoreResultService>(CoreResultService);
  });

  afterEach(async () => {
    mockReset(mockRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all CoreResults', async () => {
    const coreResult = new CoreResult();
    coreResult.website = new Website();

    coreResult.finalUrl = 'https://18f.gsa.gov';

    const expected = [coreResult];
    mockRepository.find.calledWith().mockResolvedValue(expected);

    const result = await service.findAll();

    expect(result).toStrictEqual(expected);
  });

  it('should return one CoreResult by id', async () => {
    const coreResult = new CoreResult();
    coreResult.id = 1;

    mockRepository.findOneBy.calledWith().mockResolvedValue(coreResult);
    const result = await service.findOne(1);

    expect(result).toStrictEqual(coreResult);
  });

  it('should create a CoreResult', async () => {
    const coreResult = new CoreResult();
    const website = new Website();
    website.id = 1;
    coreResult.id = 1;
    coreResult.website = website;

    await service.create(coreResult);
    expect(mockRepository.insert).toHaveBeenCalledWith(coreResult);
  });

  it('should create a CoreResult from CoreResultPages', async () => {
    const websiteId = 1;
    const scanStatus: ScanStatus = ScanStatus['Completed'];
    const pages = {
      base: {
        targetUrlBaseDomain: 'df.gov',
      },
      notFound: {
        status: scanStatus,
        result: {
          notFoundScan: {
            targetUrl404Test: false,
          },
        },
      },
      primary: {
        status: scanStatus,
        result: {
          urlScan: {
            targetUrlRedirects: null,
            finalUrl: null,
            finalUrlIsLive: null,
            finalUrlBaseDomain: null,
            finalUrlWebsite: null,
            finalUrlTopLevelDomain: null,
            finalUrlMIMEType: null,
            finalUrlSameDomain: null,
            finalUrlStatusCode: null,
            finalUrlSameWebsite: null,
          },
          dapScan: {
            dapDetected: null,
            dapParameters: null,
          },
          seoScan: {
            ogTitleFinalUrl: null,
            ogDescriptionFinalUrl: null,
            ogArticlePublishedFinalUrl: null,
            ogArticleModifiedFinalUrl: null,
            mainElementFinalUrl: null,
            canonicalLink: null,
            pageTitle: null,
            metaDescriptionContent: null,
            hreflangCodes: null,
          },
          thirdPartyScan: {
            thirdPartyServiceDomains: null,
            thirdPartyServiceCount: null,
            cookieDomains: null,
          },
          cookieScan: {
            domains: '',
          },
          uswdsScan: {
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
          },
          loginScan: {
            loginDetected: null,
            loginProvider: null,
          },
          cmsScan: {
            cms: null,
          },
          requiredLinksScan: {
            requiredLinksUrl: null,
            requiredLinksText: null,
          },
          searchScan: {
            searchDetected: null,
            searchgov: null,
          },
          mobileScan: {
            viewportMetaTag: false,
          },
        },
      },
      robotsTxt: {
        status: scanStatus,
        result: {
          robotsTxtScan: {
            robotsTxtFinalUrl: null,
            robotsTxtStatusCode: null,
            robotsTxtFinalUrlLive: null,
            robotsTxtDetected: null,
            robotsTxtFinalUrlMimeType: null,
            robotsTxtTargetUrlRedirects: null,
            robotsTxtFinalUrlSize: null,
            robotsTxtCrawlDelay: null,
            robotsTxtSitemapLocations: null,
          },
        },
      },
      sitemapXml: {
        status: scanStatus,
        result: {
          sitemapXmlScan: {
            sitemapXmlDetected: null,
            sitemapXmlStatusCode: null,
            sitemapXmlFinalUrl: null,
            sitemapXmlFinalUrlLive: null,
            sitemapTargetUrlRedirects: null,
            sitemapXmlFinalUrlFilesize: null,
            sitemapXmlFinalUrlMimeType: null,
            sitemapXmlCount: null,
            sitemapXmlPdfCount: null,
          },
        },
      },
      dns: {
        status: scanStatus,
        result: {
          dnsScan: {
            ipv6: true,
            dnsHostname: null,
          },
        },
      },
      accessibility: {
        status: scanStatus,
        result: {
          accessibilityScan: {
            accessibilityViolations: '',
            accessibilityViolationsList: '',
          },
        },
      },
      performance: {
        status: scanStatus,
        result: {
          performanceScan: {
            largestContentfulPaint: null,
            cumulativeLayoutShift: null,
          },
        },
      },
    };
    const logger = mock<Logger>();

    await service.createFromCoreResultPages(websiteId, pages, logger);
    expect(mockRepository.insert).toHaveBeenCalled();
  });
});
