import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { ScanStatus } from 'entities/scan-status';
import { CoreResultPages } from 'entities/core-result.entity';

@Injectable()
export class CoreResultService {
  constructor(
    @InjectRepository(CoreResult)
    private coreResultRepository: Repository<CoreResult>,
  ) {}

  async findAll(): Promise<CoreResult[]> {
    const results = await this.coreResultRepository.find();
    return results;
  }

  createFromCoreResultPages(
    websiteId: number,
    pages: CoreResultPages,
    logger: Logger,
    filter: boolean,
    pageviews: number,
    visits: number,
    websiteUrl: string,
  ) {
    const coreResult = new CoreResult();
    const website = new Website();
    website.id = websiteId;
    coreResult.website = website;
    coreResult.targetUrlBaseDomain = pages.base.targetUrlBaseDomain;
    coreResult.filter = filter;
    coreResult.pageviews = pageviews;
    coreResult.visits = visits;
    coreResult.initialUrl = `https://${websiteUrl}`;

    this.updatePrimaryScanResults(coreResult, pages, logger);
    this.updateNotFoundScanResults(coreResult, pages, logger);
    this.updateRobotsTxtScanResults(coreResult, pages, logger);
    this.updateSitemapXmlScanResults(coreResult, pages, logger);
    this.updateDnsScanResults(coreResult, pages, logger);
    this.updateAccessibilityScanResults(coreResult, pages, logger);
    this.updatePerformanceScanResults(coreResult, pages, logger);
    this.updateSecurityScanResults(coreResult, pages, logger);
    this.updateWwwScanResults(coreResult, pages, logger);

    return this.create(coreResult);
  }

  async create(coreResult: CoreResult) {
    const exists = await this.coreResultRepository.findOne({
      where: {
        website: {
          id: coreResult.website.id,
        },
      },
    });

    if (exists) {
      await this.coreResultRepository.update(exists.id, coreResult);
    } else {
      await this.coreResultRepository.insert(coreResult);
    }
  }

  async findOne(id: number): Promise<CoreResult> {
    return await this.coreResultRepository.findOneBy({ id: id });
  }

  private updatePrimaryScanResults(
    coreResult: CoreResult,
    pages: CoreResultPages,
    logger: Logger,
  ) {
    coreResult.primaryScanStatus = pages.primary.status;

    if (pages.primary.status === ScanStatus.Completed) {
      const result = pages.primary.result;
      // DAP scan
      coreResult.dapDetected = result.dapScan.dapDetected;
      coreResult.dapParameters = result.dapScan.dapParameters;
      coreResult.dapVersion = result.dapScan.dapVersion;
      coreResult.gaTagIds = result.dapScan.gaTagIds;

      // SEO scan
      coreResult.mainElementFinalUrl = result.seoScan.mainElementFinalUrl;
      coreResult.ogArticleModifiedFinalUrl =
        result.seoScan.ogArticleModifiedFinalUrl;
      coreResult.ogArticlePublishedFinalUrl =
        result.seoScan.ogArticlePublishedFinalUrl;
      coreResult.ogDescriptionFinalUrl = result.seoScan.ogDescriptionFinalUrl;
      coreResult.ogTitleFinalUrl = result.seoScan.ogTitleFinalUrl;
      coreResult.canonicalLink = result.seoScan.canonicalLink;
      coreResult.pageTitle = result.seoScan.pageTitle;
      coreResult.metaDescriptionContent = result.seoScan.metaDescriptionContent;
      coreResult.metaKeywordsContent = result.seoScan.metaKeywordsContent;
      coreResult.ogImageContent = result.seoScan.ogImageContent;
      coreResult.ogTypeContent = result.seoScan.ogTypeContent;
      coreResult.ogUrlContent = result.seoScan.ogUrlContent;
      coreResult.htmlLangContent = result.seoScan.htmlLangContent;
      coreResult.hrefLangContent = result.seoScan.hrefLangContent;
      // Experimental Fields #1368 Feb 2025
      coreResult.dcDateContent = result.seoScan.dcDateContent;
      coreResult.dcDateCreatedContent = result.seoScan.dcDateCreatedContent;
      coreResult.dctermsCreatedContent = result.seoScan.dctermsCreatedContent;
      coreResult.revisedContent = result.seoScan.revisedContent;
      coreResult.lastModifiedContent = result.seoScan.lastModifiedContent;
      coreResult.dateContent = result.seoScan.dateContent;
      
      // Third-party scan
      coreResult.thirdPartyServiceCount =
        result.thirdPartyScan.thirdPartyServiceCount;
      coreResult.thirdPartyServiceDomains =
        result.thirdPartyScan.thirdPartyServiceDomains;
      coreResult.thirdPartyServiceUrls =
        result.thirdPartyScan.thirdPartyServiceUrls;

      // Cookie scan
      coreResult.cookieDomains = result.cookieScan.domains;

      // Url scan
      coreResult.finalUrl = result.urlScan.finalUrl;
      coreResult.finalUrlBaseDomain = result.urlScan.finalUrlBaseDomain;
      coreResult.finalUrlWebsite = result.urlScan.finalUrlWebsite;
      coreResult.finalUrlTopLevelDomain = result.urlScan.finalUrlTopLevelDomain;
      coreResult.finalUrlIsLive = result.urlScan.finalUrlIsLive;
      coreResult.finalUrlMIMEType = result.urlScan.finalUrlMIMEType;
      coreResult.finalUrlStatusCode = result.urlScan.finalUrlStatusCode;
      coreResult.targetUrlRedirects = result.urlScan.targetUrlRedirects;
      coreResult.finalUrlPageHash = result.urlScan.finalUrlPageHash;

      // Site name - finalUrlBaseDomain with www. stripped
      coreResult.finalSiteName = coreResult.finalUrlWebsite ? coreResult.finalUrlWebsite.replace(/^www\./, '') : '';

      // USWDS scan
      coreResult.usaClasses = result.uswdsScan.usaClasses;
      coreResult.usaClassesUsed = result.uswdsScan.usaClassesUsed;
      coreResult.uswdsString = result.uswdsScan.uswdsString;
      coreResult.uswdsInlineCss = result.uswdsScan.uswdsInlineCss;
      coreResult.uswdsUsFlag = result.uswdsScan.uswdsUsFlag;
      coreResult.uswdsUsFlagInCss = result.uswdsScan.uswdsUsFlagInCss;
      coreResult.uswdsStringInCss = result.uswdsScan.uswdsStringInCss;
      coreResult.uswdsPublicSansFont = result.uswdsScan.uswdsPublicSansFont;
      coreResult.uswdsSemanticVersion = result.uswdsScan.uswdsSemanticVersion;
      coreResult.uswdsVersion = result.uswdsScan.uswdsVersion;
      coreResult.uswdsCount = result.uswdsScan.uswdsCount;
      coreResult.heresHowYouKnowBanner = result.uswdsScan.heresHowYouKnowBanner;

      // Login scan
      coreResult.loginDetected = result.loginScan.loginDetected;
      coreResult.loginProvider = result.loginScan.loginProvider;

      // CMS scan
      coreResult.cms = result.cmsScan.cms;

      // Required links scan
      coreResult.requiredLinksUrl = result.requiredLinksScan.requiredLinksUrl;
      coreResult.requiredLinksText = result.requiredLinksScan.requiredLinksText;

      // Search scan
      coreResult.searchDetected = result.searchScan.searchDetected;
      coreResult.searchgov = result.searchScan.searchgov;

      // Mobile scan
      coreResult.viewportMetaTag = result.mobileScan.viewportMetaTag;
    } else {
      logger.error({
        msg: pages.primary.error,
        page: 'primary',
      });

      coreResult.dapDetected = null;
      coreResult.dapParameters = null;
      coreResult.mainElementFinalUrl = null;
      coreResult.ogArticleModifiedFinalUrl = null;
      coreResult.ogArticlePublishedFinalUrl = null;
      coreResult.ogDescriptionFinalUrl = null;
      coreResult.ogTitleFinalUrl = null;
      coreResult.canonicalLink = null;
      coreResult.thirdPartyServiceCount = null;
      coreResult.thirdPartyServiceDomains = null;
      coreResult.thirdPartyServiceUrls = null;
      coreResult.finalUrl = null;
      coreResult.finalUrlBaseDomain = null;
      coreResult.finalUrlWebsite = null;
      coreResult.finalUrlTopLevelDomain = null;
      coreResult.finalUrlIsLive = null;
      coreResult.finalUrlMIMEType = null;
      coreResult.finalUrlStatusCode = null;
      coreResult.finalSiteName = null;
      coreResult.finalUrlPageHash = null;
      coreResult.targetUrlRedirects = null;
      coreResult.usaClasses = null;
      coreResult.usaClassesUsed = null;
      coreResult.uswdsString = null;
      coreResult.uswdsInlineCss = null;
      coreResult.uswdsUsFlag = null;
      coreResult.uswdsUsFlagInCss = null;
      coreResult.uswdsStringInCss = null;
      coreResult.uswdsPublicSansFont = null;
      coreResult.uswdsSemanticVersion = null;
      coreResult.uswdsVersion = null;
      coreResult.uswdsCount = null;
      coreResult.heresHowYouKnowBanner = null;
      coreResult.loginDetected = null;
      coreResult.loginProvider = null;
      coreResult.cms = null;
      coreResult.requiredLinksUrl = null;
      coreResult.requiredLinksText = null;
      coreResult.searchDetected = null;
      coreResult.searchgov = null;
      coreResult.viewportMetaTag = null;
      coreResult.metaKeywordsContent = null;
      coreResult.ogImageContent = null;
      coreResult.ogTypeContent = null;
      coreResult.ogUrlContent = null;
      coreResult.htmlLangContent = null;
      coreResult.hrefLangContent = null;
    }
  }

  private updateNotFoundScanResults(
    coreResult: CoreResult,
    pages: CoreResultPages,
    logger: Logger,
  ) {
    coreResult.notFoundScanStatus = pages.notFound.status;

    if (pages.notFound.status === ScanStatus.Completed) {
      coreResult.targetUrl404Test =
        pages.notFound.result.notFoundScan.targetUrl404Test;
    } else {
      logger.error({
        msg: pages.notFound.error,
        page: 'notFound',
      });

      coreResult.targetUrl404Test = null;
    }
  }

  private updateRobotsTxtScanResults(
    coreResult: CoreResult,
    pages: CoreResultPages,
    logger: Logger,
  ) {
    coreResult.robotsTxtScanStatus = pages.robotsTxt.status;

    if (pages.robotsTxt.status === ScanStatus.Completed) {
      const robotsTxt = pages.robotsTxt.result.robotsTxtScan;
      coreResult.robotsTxtFinalUrlSize = robotsTxt.robotsTxtFinalUrlSize;
      coreResult.robotsTxtCrawlDelay = robotsTxt.robotsTxtCrawlDelay;
      coreResult.robotsTxtSitemapLocations =
        robotsTxt.robotsTxtSitemapLocations;
      coreResult.robotsTxtFinalUrl = robotsTxt.robotsTxtFinalUrl;
      coreResult.robotsTxtFinalUrlMimeType =
        robotsTxt.robotsTxtFinalUrlMimeType;
      coreResult.robotsTxtStatusCode = robotsTxt.robotsTxtStatusCode;
      coreResult.robotsTxtDetected = robotsTxt.robotsTxtDetected;
    } else {
      logger.error({
        msg: pages.robotsTxt.error,
        page: 'robotsTxt',
      });

      coreResult.robotsTxtFinalUrlSize = null;
      coreResult.robotsTxtCrawlDelay = null;
      coreResult.robotsTxtSitemapLocations = null;
      coreResult.robotsTxtFinalUrl = null;
      coreResult.robotsTxtFinalUrlMimeType = null;
      coreResult.robotsTxtStatusCode = null;
      coreResult.robotsTxtDetected = null;
    }
  }

  private updateSitemapXmlScanResults(
    coreResult: CoreResult,
    pages: CoreResultPages,
    logger: Logger,
  ) {
    coreResult.sitemapXmlScanStatus = pages.sitemapXml.status;

    if (pages.sitemapXml.status === ScanStatus.Completed) {
      const sitemap = pages.sitemapXml.result.sitemapXmlScan;
      coreResult.sitemapXmlFinalUrlFilesize =
        sitemap.sitemapXmlFinalUrlFilesize;
      coreResult.sitemapXmlCount = sitemap.sitemapXmlCount;
      coreResult.sitemapXmlPdfCount = sitemap.sitemapXmlPdfCount;
      coreResult.sitemapXmlFinalUrl = sitemap.sitemapXmlFinalUrl;
      coreResult.sitemapXmlFinalUrlMimeType =
        sitemap.sitemapXmlFinalUrlMimeType;
      coreResult.sitemapXmlStatusCode = sitemap.sitemapXmlStatusCode;
      coreResult.sitemapXmlDetected = sitemap.sitemapXmlDetected;
      coreResult.sitemapXmlLastMod = sitemap.sitemapXmlLastMod;
      coreResult.sitemapXmlPageHash = sitemap.sitemapXmlPageHash;
    } else {
      logger.error({
        msg: pages.sitemapXml.error,
        page: 'sitemap.xml',
      });

      coreResult.sitemapXmlFinalUrlFilesize = null;
      coreResult.sitemapXmlCount = null;
      coreResult.sitemapXmlPdfCount = null;
      coreResult.sitemapXmlFinalUrl = null;
      coreResult.sitemapXmlFinalUrlMimeType = null;
      coreResult.sitemapXmlStatusCode = null;
      coreResult.sitemapXmlDetected = null;
      coreResult.sitemapXmlLastMod = null;
      coreResult.sitemapXmlPageHash = null;
    }
  }

  private updateDnsScanResults(
    coreResult: CoreResult,
    pages: CoreResultPages,
    logger: Logger,
  ) {
    coreResult.dnsScanStatus = pages.dns.status;

    if (pages.dns.status === ScanStatus.Completed) {
      coreResult.dnsIpv6 = pages.dns.result.dnsScan.ipv6;
      coreResult.dnsHostname = pages.dns.result.dnsScan.dnsHostname;
    } else {
      logger.error({
        msg: pages.dns.error,
        page: 'dns',
      });

      coreResult.dnsIpv6 = null;
      coreResult.dnsHostname = null;
    }
  }

  private updateAccessibilityScanResults(
    coreResult: CoreResult,
    pages: CoreResultPages,
    logger: Logger,
  ) {
    coreResult.accessibilityScanStatus = pages.accessibility.status;

    if (pages.accessibility.status === ScanStatus.Completed) {
      coreResult.accessibilityResults =
        pages.accessibility.result.accessibilityScan.accessibilityResults;
      coreResult.accessibilityResultsList =
        pages.accessibility.result.accessibilityScan.accessibilityResultsList;
    } else {
      logger.error({
        msg: pages.accessibility.error,
        page: 'accessibility',
      });

      coreResult.accessibilityResults = null;
      coreResult.accessibilityResultsList = null;
    }
  }

  private updatePerformanceScanResults(
    coreResult: CoreResult,
    pages: CoreResultPages,
    logger: Logger,
  ) {
    coreResult.performanceScanStatus = pages.performance.status;

    if (pages.performance.status === ScanStatus.Completed) {
      coreResult.largestContentfulPaint =
        pages.performance.result.performanceScan.largestContentfulPaint;

      coreResult.cumulativeLayoutShift =
        pages.performance.result.performanceScan.cumulativeLayoutShift;
    } else {
      logger.error({
        msg: pages.performance.error,
        page: 'performance',
      });

      coreResult.largestContentfulPaint = null;
      coreResult.cumulativeLayoutShift = null;
    }
  }

  private updateSecurityScanResults(
    coreResult: CoreResult,
    pages: CoreResultPages,
    logger: Logger,
  ) {
    coreResult.securityScanStatus = pages.security.status;

    if (pages.security.status === ScanStatus.Completed) {
      coreResult.httpsEnforced =
        pages.security.result.securityScan.httpsEnforced;
      coreResult.hsts = pages.security.result.securityScan.hsts;
    } else {
      logger.error({
        msg: pages.security.error,
        page: 'security',
      });

      coreResult.httpsEnforced = null;
      coreResult.hsts = null;
    }
  }

  private updateWwwScanResults(
    coreResult: CoreResult,
    pages: CoreResultPages,
    logger: Logger,
  ) {
    coreResult.wwwScanStatus = pages.www.status;

    if (pages.www.status === ScanStatus.Completed) {
      coreResult.wwwFinalUrl = pages.www.result.wwwScan.wwwFinalUrl;
      coreResult.wwwStatusCode = pages.www.result.wwwScan.wwwStatusCode;
      coreResult.wwwTitle = pages.www.result.wwwScan.wwwTitle;
      coreResult.wwwSame = pages.www.result.wwwScan.wwwSame;
    } else if (pages.www.status === ScanStatus.NotApplicable) {
      coreResult.wwwFinalUrl = null;
      coreResult.wwwStatusCode = null;
      coreResult.wwwTitle = null;
      coreResult.wwwSame = null;
    } else {
      logger.error({
        msg: pages.www.error,
        page: 'www',
      });

      coreResult.wwwFinalUrl = null;
      coreResult.wwwStatusCode = null;
      coreResult.wwwTitle = null;
      coreResult.wwwSame = null;
    }
  }
}
