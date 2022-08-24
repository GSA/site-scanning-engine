import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as ScanPage from 'entities/scan-page.entity';
import { CoreResult } from 'entities/core-result.entity';
import { BaseScan } from 'entities/scan-data.entity';
import { Website } from 'entities/website.entity';
import { ScanStatus } from 'entities/scan-status';

// The CoreResult table includes all scan data. Create a type that represents this.
export type CoreResultPages = {
  base: BaseScan;
  notFound: ScanPage.NotFoundPageScan;
  primary: ScanPage.PrimaryScan;
  robotsTxt: ScanPage.RobotsTxtPageScan;
  sitemapXml: ScanPage.SitemapXmlPageScan;
  dns: ScanPage.DnsPageScan;
};

@Injectable()
export class CoreResultService {
  private logger = new Logger(CoreResultService.name);

  constructor(
    @InjectRepository(CoreResult) private coreResult: Repository<CoreResult>,
  ) {}

  async findAll(): Promise<CoreResult[]> {
    const results = await this.coreResult.find();
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

    // Base scan data
    coreResult.targetUrlBaseDomain = pages.base.targetUrlBaseDomain;

    // Home page data
    coreResult.primaryScanStatus = pages.primary.status;
    if (pages.primary.status !== ScanStatus.Completed) {
      logger.error({
        msg: pages.primary.error,
        page: 'primary',
      });
    } else {
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

      // Third-party scan
      coreResult.thirdPartyServiceCount =
        result.thirdPartyScan.thirdPartyServiceCount;
      coreResult.thirdPartyServiceDomains =
        result.thirdPartyScan.thirdPartyServiceDomains;

      // Url scan
      coreResult.finalUrl = result.urlScan.finalUrl;
      coreResult.finalUrlBaseDomain = result.urlScan.finalUrlBaseDomain;
      coreResult.finalUrlIsLive = result.urlScan.finalUrlIsLive;
      coreResult.finalUrlMIMEType = result.urlScan.finalUrlMIMEType;
      coreResult.finalUrlSameDomain = result.urlScan.finalUrlSameDomain;
      coreResult.finalUrlSameWebsite = result.urlScan.finalUrlSameWebsite;
      coreResult.finalUrlStatusCode = result.urlScan.finalUrlStatusCode;
      coreResult.targetUrlRedirects = result.urlScan.targetUrlRedirects;

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
    }

    coreResult.notFoundScanStatus = pages.notFound.status;
    if (pages.notFound.status !== ScanStatus.Completed) {
      logger.error({
        msg: pages.notFound.error,
        page: 'notFound',
      });
    } else {
      coreResult.targetUrl404Test =
        pages.notFound.result.notFoundScan.targetUrl404Test;
    }

    coreResult.robotsTxtScanStatus = pages.robotsTxt.status;
    if (pages.robotsTxt.status !== ScanStatus.Completed) {
      logger.error({
        msg: pages.robotsTxt.error,
        page: 'robotsTxt',
      });
    } else {
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
    }

    coreResult.sitemapXmlScanStatus = pages.sitemapXml.status;
    if (pages.sitemapXml.status !== ScanStatus.Completed) {
      logger.error({
        msg: pages.sitemapXml.error,
        page: 'sitemap.xml',
      });
    } else {
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
    }

    coreResult.dnsScanStatus = pages.dns.status;
    if (pages.dns.status !== ScanStatus.Completed) {
      coreResult.dnsScanStatus = pages.dns.error;
    } else {
      coreResult.dnsIpv6 = pages.dns.result.dnsScan.ipv6;
    }

    return this.create(coreResult);
  }

  async findOne(id: number): Promise<CoreResult> {
    const result = await this.coreResult.findOne(id);
    return result;
  }

  async findResultsWithWebsite() {
    const result = await this.coreResult.find({
      relations: ['website'],
    });

    return result;
  }

  async create(coreResult: CoreResult) {
    const exists = await this.coreResult.findOne({
      where: {
        website: {
          id: coreResult.website.id,
        },
      },
    });
    if (exists) {
      await this.coreResult.update(exists.id, coreResult);
    } else {
      await this.coreResult.insert(coreResult);
    }
  }
}
