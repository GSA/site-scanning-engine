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
  ) {
    const coreResult = new CoreResult();
    const website = new Website();
    website.id = websiteId;
    coreResult.website = website;
    coreResult.targetUrlBaseDomain = pages.base.targetUrlBaseDomain;

    this.updatePrimaryScanResults(coreResult, pages, logger);
    this.updateNotFoundScanResults(coreResult, pages, logger);
    this.updateRobotsTxtScanResults(coreResult, pages, logger);
    this.updateSitemapXmlScanResults(coreResult, pages, logger);
    this.updateDnsScanResults(coreResult, pages, logger);

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

      // SEO scan
      coreResult.mainElementFinalUrl = result.seoScan.mainElementFinalUrl;
      coreResult.ogArticleModifiedFinalUrl =
        result.seoScan.ogArticleModifiedFinalUrl;
      coreResult.ogArticlePublishedFinalUrl =
        result.seoScan.ogArticlePublishedFinalUrl;
      coreResult.ogDescriptionFinalUrl = result.seoScan.ogDescriptionFinalUrl;
      coreResult.ogTitleFinalUrl = result.seoScan.ogTitleFinalUrl;
      coreResult.canonicalLink = result.seoScan.canonicalLink;

      // Third-party scan
      coreResult.thirdPartyServiceCount =
        result.thirdPartyScan.thirdPartyServiceCount;
      coreResult.thirdPartyServiceDomains =
        result.thirdPartyScan.thirdPartyServiceDomains;

      // Url scan
      coreResult.finalUrl = result.urlScan.finalUrl;
      coreResult.finalUrlBaseDomain = result.urlScan.finalUrlBaseDomain;
      coreResult.finalUrlWebsite = result.urlScan.finalUrlWebsite;
      coreResult.finalUrlIsLive = result.urlScan.finalUrlIsLive;
      coreResult.finalUrlMIMEType = result.urlScan.finalUrlMIMEType;
      coreResult.finalUrlSameDomain = result.urlScan.finalUrlSameDomain;
      coreResult.finalUrlSameWebsite = result.urlScan.finalUrlSameWebsite;
      coreResult.finalUrlStatusCode = result.urlScan.finalUrlStatusCode;
      coreResult.targetUrlRedirects = result.urlScan.targetUrlRedirects;

      // USWDS scan
      coreResult.usaClasses = result.uswdsScan.usaClasses;
      coreResult.uswdsString = result.uswdsScan.uswdsString;
      coreResult.uswdsInlineCss = result.uswdsScan.uswdsInlineCss;
      coreResult.uswdsUsFlag = result.uswdsScan.uswdsUsFlag;
      coreResult.uswdsUsFlagInCss = result.uswdsScan.uswdsUsFlagInCss;
      coreResult.uswdsStringInCss = result.uswdsScan.uswdsStringInCss;
      coreResult.uswdsPublicSansFont = result.uswdsScan.uswdsPublicSansFont;
      coreResult.uswdsSemanticVersion = result.uswdsScan.uswdsSemanticVersion;
      coreResult.uswdsVersion = result.uswdsScan.uswdsVersion;
      coreResult.uswdsCount = result.uswdsScan.uswdsCount;

      // Login scan
      coreResult.loginDetected = result.loginScan.loginDetected;
      coreResult.loginProvider = result.loginScan.loginProvider;

      // Cloud.gov Pages scan
      coreResult.cloudDotGovPages =
        result.cloudDotGovPagesScan.cloudDotGovPages;

      // CMS scan
      coreResult.cms = result.cmsScan.cms;

      // HSTS scan
      coreResult.hsts = result.hstsScan.hsts;

      // Required links scan
      coreResult.requiredLinksUrl = result.requiredLinksScan.requiredLinksUrl;
      coreResult.requiredLinksText = result.requiredLinksScan.requiredLinksText;
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
      coreResult.finalUrl = null;
      coreResult.finalUrlBaseDomain = null;
      coreResult.finalUrlWebsite = null;
      coreResult.finalUrlIsLive = null;
      coreResult.finalUrlMIMEType = null;
      coreResult.finalUrlSameDomain = null;
      coreResult.finalUrlSameWebsite = null;
      coreResult.finalUrlStatusCode = null;
      coreResult.targetUrlRedirects = null;
      coreResult.usaClasses = null;
      coreResult.uswdsString = null;
      coreResult.uswdsInlineCss = null;
      coreResult.uswdsUsFlag = null;
      coreResult.uswdsUsFlagInCss = null;
      coreResult.uswdsStringInCss = null;
      coreResult.uswdsPublicSansFont = null;
      coreResult.uswdsSemanticVersion = null;
      coreResult.uswdsVersion = null;
      coreResult.uswdsCount = null;
      coreResult.loginDetected = null;
      coreResult.loginProvider = null;
      coreResult.cloudDotGovPages = null;
      coreResult.cms = null;
      coreResult.hsts = null;
      coreResult.requiredLinksUrl = null;
      coreResult.requiredLinksText = null;
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
      coreResult.robotsTxtFinalUrlLive = robotsTxt.robotsTxtFinalUrlLive;
      coreResult.robotsTxtTargetUrlRedirects =
        robotsTxt.robotsTxtTargetUrlRedirects;
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
      coreResult.robotsTxtFinalUrlLive = null;
      coreResult.robotsTxtTargetUrlRedirects = null;
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
      coreResult.sitemapXmlFinalUrlLive = sitemap.sitemapXmlFinalUrlLive;
      coreResult.sitemapTargetUrlRedirects = sitemap.sitemapTargetUrlRedirects;
      coreResult.sitemapXmlFinalUrlMimeType =
        sitemap.sitemapXmlFinalUrlMimeType;
      coreResult.sitemapXmlStatusCode = sitemap.sitemapXmlStatusCode;
      coreResult.sitemapXmlDetected = sitemap.sitemapXmlDetected;
    } else {
      logger.error({
        msg: pages.sitemapXml.error,
        page: 'sitemap.xml',
      });

      coreResult.sitemapXmlFinalUrlFilesize = null;
      coreResult.sitemapXmlCount = null;
      coreResult.sitemapXmlPdfCount = null;
      coreResult.sitemapXmlFinalUrl = null;
      coreResult.sitemapXmlFinalUrlLive = null;
      coreResult.sitemapTargetUrlRedirects = null;
      coreResult.sitemapXmlFinalUrlMimeType = null;
      coreResult.sitemapXmlStatusCode = null;
      coreResult.sitemapXmlDetected = null;
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
}
