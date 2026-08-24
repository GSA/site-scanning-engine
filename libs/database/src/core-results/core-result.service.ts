import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { ScanStatus } from 'entities/scan-status';
import { CoreResultPages } from 'entities/core-result.entity';
import { WebsiteService } from '@app/database/websites/websites.service';
import { getBaseDomain, getHttpsUrl } from '@app/core-scanner/util';
import {
  mapPrimary,
  mapNotFound,
  mapRobotsTxt,
  mapSitemapXml,
  mapDns,
  mapAccessibility,
  mapPerformance,
  mapSecurity,
  mapWww,
  clearPrimary,
} from './core-result-mapper';

@Injectable()
export class CoreResultService {
  constructor(
    @InjectRepository(CoreResult)
    private coreResultRepository: Repository<CoreResult>,
    private websiteService: WebsiteService,
  ) {}

  async findAll(): Promise<CoreResult[]> {
    const results = await this.coreResultRepository.find();
    return results;
  }

  async createFromCoreResultPages(
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

    mapPrimary(coreResult, pages, logger);
    mapNotFound(coreResult, pages, logger);
    mapRobotsTxt(coreResult, pages, logger);
    mapSitemapXml(coreResult, pages, logger);
    mapDns(coreResult, pages, logger);
    mapAccessibility(coreResult, pages, logger);
    mapPerformance(coreResult, pages, logger);
    mapSecurity(coreResult, pages, logger);
    mapWww(coreResult, pages, logger);

    if (
      coreResult.finalUrlMIMEType &&
      CoreResult.filteredMediaTypes.includes(coreResult.finalUrlMIMEType)
    ) {
      coreResult.filter = true;
      await this.websiteService.setFilter(websiteId, true);
    }

    await this.upsertCoreResult(coreResult);
  }

  async findOne(id: number): Promise<CoreResult> {
    return await this.coreResultRepository.findOneBy({ id: id });
  }

  async writeFailedResult(
    websiteId: number,
    status: ScanStatus,
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
    coreResult.targetUrlBaseDomain = getBaseDomain(getHttpsUrl(websiteUrl));
    coreResult.filter = filter;
    coreResult.pageviews = pageviews;
    coreResult.visits = visits;
    coreResult.initialUrl = getHttpsUrl(websiteUrl);

    // Set all scan status columns to the failure status
    coreResult.primaryScanStatus = status;
    coreResult.notFoundScanStatus = status;
    coreResult.robotsTxtScanStatus = status;
    coreResult.sitemapXmlScanStatus = status;
    coreResult.dnsScanStatus = status;
    coreResult.accessibilityScanStatus = status;
    coreResult.performanceScanStatus = status;
    coreResult.securityScanStatus = status;
    coreResult.wwwScanStatus = status;

    // Clear all data columns
    clearPrimary(coreResult);
    coreResult.targetUrl404Test = null;
    coreResult.robotsTxtFinalUrlSize = null;
    coreResult.robotsTxtCrawlDelay = null;
    coreResult.robotsTxtSitemapLocations = null;
    coreResult.robotsTxtFinalUrl = null;
    coreResult.robotsTxtFinalUrlMimeType = null;
    coreResult.robotsTxtStatusCode = null;
    coreResult.robotsTxtDetected = null;
    coreResult.sitemapXmlFinalUrlFilesize = null;
    coreResult.sitemapXmlCount = null;
    coreResult.sitemapXmlPdfCount = null;
    coreResult.sitemapXmlFinalUrl = null;
    coreResult.sitemapXmlFinalUrlMimeType = null;
    coreResult.sitemapXmlStatusCode = null;
    coreResult.sitemapXmlDetected = null;
    coreResult.sitemapXmlLastMod = null;
    coreResult.sitemapXmlPageHash = null;
    coreResult.dnsIpv6 = null;
    coreResult.dnsHostname = null;
    coreResult.accessibilityResults = null;
    coreResult.accessibilityResultsList = null;
    coreResult.largestContentfulPaint = null;
    coreResult.cumulativeLayoutShift = null;
    coreResult.httpsEnforced = null;
    coreResult.hsts = null;
    coreResult.wwwFinalUrl = null;
    coreResult.wwwStatusCode = null;
    coreResult.wwwTitle = null;
    coreResult.wwwSame = null;

    // Upsert: update if exists, insert otherwise
    await this.upsertCoreResult(coreResult);
  }

  private async upsertCoreResult(coreResult: CoreResult) {
    const exists = await this.coreResultRepository.findOne({
      where: {
        website: {
          id: coreResult.website.id,
        },
      },
    });

    if (exists) {
      // Explicitly set `updated` so TypeORM's @UpdateDateColumn is refreshed.
      // repository.update() issues a raw SQL UPDATE that bypasses TypeORM's
      // entity lifecycle hooks, leaving `updated` (= scan_date) stale for sites
      // that already have a core_result row. Setting it here avoids the extra
      // SELECT that repository.save() would otherwise perform internally.
      await this.coreResultRepository.update(exists.id, {
        ...coreResult,
        updated: new Date().toISOString(),
      });
    } else {
      await this.coreResultRepository.insert(coreResult);
    }
  }

  /**
   * Bulk-updates dapDataDate and httpsDataDate on every row in core_result.
   *
   * These two columns reflect the freshness of the external source files that
   * supply DAP analytics and HTTPS/HSTS data. Because a single date applies
   * to the entire dataset (not per-scan), one bulk UPDATE is correct and
   * intentionally leaves scan_date (updated) untouched.
   */
  async updateDataFreshnessDates(
    dapDataDate: string,
    httpsDataDate: string,
  ): Promise<void> {
    await this.coreResultRepository
      .createQueryBuilder()
      .update(CoreResult)
      .set({ dapDataDate, httpsDataDate })
      .where('1 = 1')
      .execute();
  }
}
