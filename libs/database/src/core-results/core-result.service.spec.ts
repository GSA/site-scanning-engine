import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { mock, mockReset } from 'jest-mock-extended';
import { Repository } from 'typeorm';
import { CoreResultService } from './core-result.service';
import { WebsiteService } from '@app/database/websites/websites.service';
import { Logger } from '@nestjs/common';
import { ScanStatus } from 'entities/scan-status';

describe('CoreResultService', () => {
  let service: CoreResultService;
  let mockRepository: any;
  let mockWebsiteService: any;

  beforeEach(async () => {
    mockRepository = mock<Repository<CoreResult>>();
    mockWebsiteService = mock<WebsiteService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoreResultService,
        {
          provide: getRepositoryToken(CoreResult),
          useValue: mockRepository,
        },
        {
          provide: WebsiteService,
          useValue: mockWebsiteService,
        },
      ],
    }).compile();

    service = module.get<CoreResultService>(CoreResultService);
  });

  afterEach(async () => {
    mockReset(mockRepository);
    mockReset(mockWebsiteService);
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

  it('should create a CoreResult from CoreResultPages', async () => {
    const websiteId = 1;
    const scanStatus: ScanStatus = ScanStatus['Completed'];
    const websiteUrl = 'https://18f.gsa.gov';

    // Fixme: This test is very brittle. Any changes to any scan will basically
    //        cause this mock object to type mismatch. If our test is only looking
    //        for a single `.insert()` call, then why does the mock object need to
    //        be so precise? - LC 08/19/2024
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
            finalUrlPageHash: null,
          },
          dapScan: {
            dapDetected: null,
            dapParameters: null,
            dapVersion: '',
            gaTagIds: '',
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
            metaKeywordsContent: null,
            ogImageContent: null,
            ogTypeContent: null,
            ogUrlContent: null,
            htmlLangContent: null,
            hrefLangContent: null,
            dcDateContent: null,
            dcDateCreatedContent: null,
            dctermsCreatedContent: null,
            revisedContent: null,
            lastModifiedContent: null,
            dateContent: null,
          },
          thirdPartyScan: {
            thirdPartyServiceDomains: null,
            thirdPartyServiceCount: null,
            cookieDomains: null,
            thirdPartyServiceUrls: null,
          },
          cookieScan: {
            domains: '',
          },
          uswdsScan: {
            usaClasses: null,
            usaElementsUsed: null,
            usaClassesUsed: null,
            uswdsString: null,
            uswdsInlineCss: null,
            uswdsUsFlag: null,
            uswdsStringInCss: null,
            uswdsUsFlagInCss: null,
            uswdsPublicSansFont: null,
            uswdsSemanticVersion: null,
            uswdsVersion: null,
            uswdsCount: null,
            heresHowYouKnowBanner: null,
          },
          loginScan: {
            loginDetected: null,
            loginProvider: null,
          },
          cmsScan: {
            cms: null,
          },
          requiredLinksScan: {
            hyperlinkDomains: null,
            requiredLinksUrl: null,
            requiredLinksText: null,
          },
          feedbackLinksScan: {
            feedbackLinksText: null,
          },
          searchScan: {
            searchDetected: null,
            searchgov: null,
          },
          mobileScan: {
            viewportMetaTag: false,
          },
          toolingScan: {
            tooling: null,
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
            sitemapXmlLastMod: null,
            sitemapXmlPageHash: null,
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
            accessibilityResults: '',
            accessibilityResultsList: '',
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
      security: {
        status: scanStatus,
        result: {
          securityScan: {
            httpsEnforced: null,
            hsts: null,
          },
        },
      },
      clientRedirect: {
        status: scanStatus,
        result: {
          clientRedirectScan: {
            hasClientRedirect: null,
            usesJsRedirect: null,
            usesMetaRefresh: null,
          },
        },
      },
      www: {
        status: scanStatus,
        result: {
          wwwScan: {
            wwwFinalUrl: null,
            wwwStatusCode: null,
            wwwTitle: null,
            wwwSame: null,
          },
        },
      },
    };
    const logger = mock<Logger>();

    await service.createFromCoreResultPages(
      websiteId,
      pages,
      logger,
      false,
      1,
      1,
      websiteUrl,
    );
    expect(mockRepository.insert).toHaveBeenCalled();
    expect(mockWebsiteService.setFilter).not.toHaveBeenCalled();
    expect(mockRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ filter: false }),
    );
  });

  it('should call setFilter when finalUrlMIMEType is a filtered type', async () => {
    const websiteId = 1;
    const scanStatus: ScanStatus = ScanStatus['Completed'];
    const websiteUrl = 'https://example.gov';

    const pages = {
      base: {
        targetUrlBaseDomain: 'example.gov',
      },
      notFound: {
        status: scanStatus,
        result: {
          notFoundScan: { targetUrl404Test: false },
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
            finalUrlMIMEType: 'application/json',
            finalUrlSameDomain: null,
            finalUrlStatusCode: null,
            finalUrlSameWebsite: null,
            finalUrlPageHash: null,
          },
          dapScan: {
            dapDetected: null,
            dapParameters: null,
            dapVersion: '',
            gaTagIds: '',
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
            metaKeywordsContent: null,
            ogImageContent: null,
            ogTypeContent: null,
            ogUrlContent: null,
            htmlLangContent: null,
            hrefLangContent: null,
            dcDateContent: null,
            dcDateCreatedContent: null,
            dctermsCreatedContent: null,
            revisedContent: null,
            lastModifiedContent: null,
            dateContent: null,
          },
          thirdPartyScan: {
            thirdPartyServiceDomains: null,
            thirdPartyServiceCount: null,
            cookieDomains: null,
            thirdPartyServiceUrls: null,
          },
          cookieScan: { domains: '' },
          uswdsScan: {
            usaClasses: null,
            usaElementsUsed: null,
            usaClassesUsed: null,
            uswdsString: null,
            uswdsInlineCss: null,
            uswdsUsFlag: null,
            uswdsStringInCss: null,
            uswdsUsFlagInCss: null,
            uswdsPublicSansFont: null,
            uswdsSemanticVersion: null,
            uswdsVersion: null,
            uswdsCount: null,
            heresHowYouKnowBanner: null,
          },
          loginScan: { loginDetected: null, loginProvider: null },
          cmsScan: { cms: null },
          requiredLinksScan: {
            hyperlinkDomains: null,
            requiredLinksUrl: null,
            requiredLinksText: null,
          },
          feedbackLinksScan: {
            feedbackLinksText: null,
          },
          searchScan: { searchDetected: null, searchgov: null },
          mobileScan: { viewportMetaTag: false },
          toolingScan: { tooling: null },
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
            sitemapXmlLastMod: null,
            sitemapXmlPageHash: null,
            sitemapXmlCount: null,
            sitemapXmlPdfCount: null,
          },
        },
      },
      dns: {
        status: scanStatus,
        result: { dnsScan: { ipv6: true, dnsHostname: null } },
      },
      accessibility: {
        status: scanStatus,
        result: {
          accessibilityScan: {
            accessibilityResults: '',
            accessibilityResultsList: '',
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
      security: {
        status: scanStatus,
        result: { securityScan: { httpsEnforced: null, hsts: null } },
      },
      clientRedirect: {
        status: scanStatus,
        result: {
          clientRedirectScan: {
            hasClientRedirect: null,
            usesJsRedirect: null,
            usesMetaRefresh: null,
          },
        },
      },
      www: {
        status: scanStatus,
        result: {
          wwwScan: {
            wwwFinalUrl: null,
            wwwStatusCode: null,
            wwwTitle: null,
            wwwSame: null,
          },
        },
      },
    };
    const logger = mock<Logger>();

    await service.createFromCoreResultPages(
      websiteId,
      pages,
      logger,
      false,
      1,
      1,
      websiteUrl,
    );

    expect(mockRepository.insert).toHaveBeenCalled();
    expect(mockWebsiteService.setFilter).toHaveBeenCalledWith(websiteId, true);
    expect(mockRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ filter: true }),
    );
  });

  it('should write a failure result with all statuses set and all data nulled', async () => {
    const websiteId = 1;
    const failureStatus = ScanStatus.InvalidSSLCert;
    const websiteUrl = '18f.gov';
    const logger = mock<Logger>();

    mockRepository.findOne.calledWith().mockResolvedValue(null);

    await service.writeFailedResult(
      websiteId,
      failureStatus,
      logger,
      false,
      100,
      50,
      websiteUrl,
    );

    expect(mockRepository.insert).toHaveBeenCalled();
    expect(mockRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        primaryScanStatus: failureStatus,
        notFoundScanStatus: failureStatus,
        robotsTxtScanStatus: failureStatus,
        sitemapXmlScanStatus: failureStatus,
        dnsScanStatus: failureStatus,
        accessibilityScanStatus: failureStatus,
        performanceScanStatus: failureStatus,
        securityScanStatus: failureStatus,
        wwwScanStatus: failureStatus,
        finalUrl: null,
        pageTitle: null,
        accessibilityResults: null,
        wwwFinalUrl: null,
        targetUrl404Test: null,
        dnsHostname: null,
        filter: false,
        pageviews: 100,
        visits: 50,
        initialUrl: 'https://18f.gov',
      }),
    );
    expect(mockWebsiteService.setFilter).not.toHaveBeenCalled();
  });

  it('should update existing result when writeFailedResult is called for existing website', async () => {
    const websiteId = 1;
    const failureStatus = ScanStatus.DNSResolutionError;
    const websiteUrl = '18f.gov';
    const logger = mock<Logger>();

    const existingResult = new CoreResult();
    existingResult.id = 123;
    mockRepository.findOne.calledWith().mockResolvedValue(existingResult);

    await service.writeFailedResult(
      websiteId,
      failureStatus,
      logger,
      false,
      100,
      50,
      websiteUrl,
    );

    // `updated` is set explicitly so @UpdateDateColumn is refreshed even
    // though repository.update() bypasses TypeORM's lifecycle hooks.
    expect(mockRepository.update).toHaveBeenCalledWith(
      123,
      expect.objectContaining({
        primaryScanStatus: failureStatus,
        notFoundScanStatus: failureStatus,
        finalUrl: null,
        pageTitle: null,
        updated: expect.any(String),
      }),
    );
    expect(mockRepository.insert).not.toHaveBeenCalled();
  });

  // ─── Null sub-scan guard tests ───────────────────────────────────────────────
  // When primary.status === Completed, each sub-scan result may be null if that
  // individual scan threw internally (runScan in primary.ts catches and returns
  // null).  The service must not crash — it should null-out the relevant fields.
  //
  // Before the fix, dapScan, thirdPartyScan, cookieScan, urlScan,
  // requiredLinksScan, feedbackLinksScan, searchScan, mobileScan, and toolingScan
  // were accessed unconditionally, so a null value threw a TypeError and crashed
  // the entire consumer job.

  describe('updatePrimaryScanResults — null sub-scan guards', () => {
    // Build a minimal completed-primary pages object where every sub-scan is
    // present and valid.  Individual tests override specific sub-scans to null.
    function buildCompletedPages(primaryResultOverrides: Record<string, any> = {}) {
      const completed = ScanStatus.Completed as const;
      return {
        base: { targetUrlBaseDomain: 'example.gov' },
        notFound: {
          status: completed,
          result: { notFoundScan: { targetUrl404Test: false } },
        },
        primary: {
          status: completed,
          result: {
            urlScan: {
              targetUrlRedirects: false,
              finalUrl: 'https://example.gov/',
              finalUrlIsLive: true,
              finalUrlBaseDomain: 'example.gov',
              finalUrlWebsite: 'example.gov',
              finalUrlTopLevelDomain: 'gov',
              finalUrlMIMEType: 'text/html',
              finalUrlSameDomain: true,
              finalUrlStatusCode: 200,
              finalUrlSameWebsite: true,
              finalUrlPageHash: 'abc123',
            },
            dapScan: {
              dapDetected: false,
              dapParameters: null,
              dapVersion: '',
              gaTagIds: '',
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
              metaKeywordsContent: null,
              ogImageContent: null,
              ogTypeContent: null,
              ogUrlContent: null,
              htmlLangContent: null,
              hrefLangContent: null,
              dcDateContent: null,
              dcDateCreatedContent: null,
              dctermsCreatedContent: null,
              revisedContent: null,
              lastModifiedContent: null,
              dateContent: null,
            },
            thirdPartyScan: {
              thirdPartyServiceDomains: null,
              thirdPartyServiceCount: 0,
              thirdPartyServiceUrls: null,
            },
            cookieScan: { domains: '' },
            uswdsScan: {
              usaClasses: 0,
              usaElementsUsed: '',
              usaClassesUsed: '',
              uswdsString: 0,
              uswdsInlineCss: 0,
              uswdsUsFlag: 0,
              uswdsStringInCss: 0,
              uswdsUsFlagInCss: 0,
              uswdsPublicSansFont: 0,
              uswdsSemanticVersion: null,
              uswdsVersion: 0,
              uswdsCount: 0,
              heresHowYouKnowBanner: false,
            },
            loginScan: { loginDetected: null, loginProvider: null },
            cmsScan: { cms: null },
            requiredLinksScan: {
              hyperlinkDomains: null,
              requiredLinksUrl: null,
              requiredLinksText: null,
            },
            feedbackLinksScan: { feedbackLinksText: null },
            searchScan: { searchDetected: false, searchgov: false },
            mobileScan: { viewportMetaTag: true },
            toolingScan: { tooling: null },
            ...primaryResultOverrides,
          },
        },
        robotsTxt: {
          status: completed,
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
          status: completed,
          result: {
            sitemapXmlScan: {
              sitemapXmlDetected: null,
              sitemapXmlStatusCode: null,
              sitemapXmlFinalUrl: null,
              sitemapXmlFinalUrlLive: null,
              sitemapTargetUrlRedirects: null,
              sitemapXmlFinalUrlFilesize: null,
              sitemapXmlFinalUrlMimeType: null,
              sitemapXmlLastMod: null,
              sitemapXmlPageHash: null,
              sitemapXmlCount: null,
              sitemapXmlPdfCount: null,
            },
          },
        },
        dns: {
          status: completed,
          result: { dnsScan: { ipv6: false, dnsHostname: null } },
        },
        accessibility: {
          status: completed,
          result: {
            accessibilityScan: {
              accessibilityResults: '',
              accessibilityResultsList: '',
            },
          },
        },
        performance: {
          status: completed,
          result: {
            performanceScan: {
              largestContentfulPaint: null,
              cumulativeLayoutShift: null,
            },
          },
        },
        security: {
          status: completed,
          result: { securityScan: { httpsEnforced: null, hsts: null } },
        },
        clientRedirect: {
          status: completed,
          result: {
            clientRedirectScan: {
              hasClientRedirect: null,
              usesJsRedirect: null,
              usesMetaRefresh: null,
            },
          },
        },
        www: {
          status: completed,
          result: {
            wwwScan: {
              wwwFinalUrl: null,
              wwwStatusCode: null,
              wwwTitle: null,
              wwwSame: null,
            },
          },
        },
      };
    }

    async function runWithNullSubScan(subScanKey: string) {
      const pages = buildCompletedPages({ [subScanKey]: null });
      const logger = mock<Logger>();
      // Should not throw — previously these crashed with TypeError
      await service.createFromCoreResultPages(1, pages, logger, false, 0, 0, 'example.gov');
      expect(mockRepository.insert).toHaveBeenCalled();
    }

    it('does not crash when dapScan is null, and nulls out dap fields', async () => {
      await runWithNullSubScan('dapScan');
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          dapDetected: null,
          dapParameters: null,
          dapVersion: null,
          gaTagIds: null,
        }),
      );
    });

    it('does not crash when thirdPartyScan is null, and nulls out third-party fields', async () => {
      await runWithNullSubScan('thirdPartyScan');
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          thirdPartyServiceCount: null,
          thirdPartyServiceDomains: null,
          thirdPartyServiceUrls: null,
        }),
      );
    });

    it('does not crash when cookieScan is null, and nulls out cookie fields', async () => {
      await runWithNullSubScan('cookieScan');
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({ cookieDomains: null }),
      );
    });

    it('does not crash when urlScan is null, and nulls out url fields', async () => {
      await runWithNullSubScan('urlScan');
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          finalUrl: null,
          finalUrlBaseDomain: null,
          finalUrlIsLive: null,
          finalUrlMIMEType: null,
          finalUrlStatusCode: null,
          targetUrlRedirects: null,
        }),
      );
    });

    it('does not crash when requiredLinksScan is null, and nulls out required-links fields', async () => {
      await runWithNullSubScan('requiredLinksScan');
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          hyperlinkDomains: null,
          requiredLinksUrl: null,
          requiredLinksText: null,
        }),
      );
    });

    it('does not crash when feedbackLinksScan is null, and nulls out feedback-links fields', async () => {
      await runWithNullSubScan('feedbackLinksScan');
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({ feedbackLinksText: null }),
      );
    });

    it('does not crash when searchScan is null, and nulls out search fields', async () => {
      await runWithNullSubScan('searchScan');
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          searchDetected: null,
          searchgov: null,
        }),
      );
    });

    it('does not crash when mobileScan is null, and nulls out mobile fields', async () => {
      await runWithNullSubScan('mobileScan');
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({ viewportMetaTag: null }),
      );
    });

    it('does not crash when toolingScan is null, and nulls out tooling fields', async () => {
      await runWithNullSubScan('toolingScan');
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({ tooling: null }),
      );
    });
  });

  describe('updateDataFreshnessDates', () => {
    it('bulk-updates dapDataDate and httpsDataDate on all rows', async () => {
      const mockExecute = jest.fn().mockResolvedValue({ affected: 42 });
      const mockWhere = jest.fn().mockReturnValue({ execute: mockExecute });
      const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
      const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });
      mockRepository.createQueryBuilder.mockReturnValue({
        update: mockUpdate,
      });

      await service.updateDataFreshnessDates('2026-05-16', '2026-05-21');

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith(CoreResult);
      expect(mockSet).toHaveBeenCalledWith({
        dapDataDate: '2026-05-16',
        httpsDataDate: '2026-05-21',
      });
      expect(mockWhere).toHaveBeenCalledWith('1 = 1');
      expect(mockExecute).toHaveBeenCalled();
    });
  });
});
