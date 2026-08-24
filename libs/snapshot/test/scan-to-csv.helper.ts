/**
 * scan-to-csv.helper.ts
 *
 * Shared logic for the no-DB, live-scan preview path:
 *   CoreResultPages → CoreResult → Website → serialized() → CSV row
 *
 * This mirrors exactly what the DB-backed snapshot pipeline does, allowing the
 * full scan→map→serialize chain to be exercised without Postgres or Redis.
 *
 * Used by:
 *   - libs/snapshot/test/preview-snapshot.e2e-spec.ts  (Jest CI gating)
 *   - scripts/export-snapshot.ts --live                (local CSV generation)
 */

import { classToPlain } from 'class-transformer';
import { Logger } from '@nestjs/common';
import { CoreResult, CoreResultPages } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { ScanStatus } from 'entities/scan-status';
import { getBaseDomain, getHttpsUrl } from '@app/core-scanner/util';
import { formatValue } from '@app/snapshot/serializers/csv-helpers';

/**
 * All @Expose()-ed names present on CoreResult that are @Exclude()-ed from the
 * public snapshot. Add a new name here whenever a new hidden field is added.
 *
 * These names are appended after snapshotColumnOrder when --include-hidden is
 * requested, so they never disturb the public column order.
 */
export const HIDDEN_EXPOSE_NAMES: string[] = [
  'secondary_data_dates',
  'accessibility_results_list',
  'dc_date_content',
  'dc_date_created_content',
  'dcterms_created_content',
  'revised_content',
  'last_modified_content',
  'date_content',
];

/**
 * Builds an in-memory CoreResult from a live scan result, replicating the
 * field-mapping logic in CoreResultService without touching Postgres.
 *
 * websiteId is synthetic (used only to satisfy the Website relation shape).
 */
export function buildCoreResult(
  websiteId: number,
  websiteUrl: string,
  pages: CoreResultPages,
  filter: boolean = false,
  pageviews: number = 0,
  visits: number = 0,
): CoreResult {
  const logger = new Logger('scan-to-csv.helper');

  const coreResult = new CoreResult();
  const website = new Website();
  website.id = websiteId;
  coreResult.website = website;
  coreResult.targetUrlBaseDomain = pages.base.targetUrlBaseDomain;
  coreResult.filter = filter;
  coreResult.pageviews = pageviews;
  coreResult.visits = visits;
  coreResult.initialUrl = getHttpsUrl(websiteUrl);

  applyPrimary(coreResult, pages, logger);
  applyNotFound(coreResult, pages, logger);
  applyRobotsTxt(coreResult, pages, logger);
  applySitemapXml(coreResult, pages, logger);
  applyDns(coreResult, pages, logger);
  applyAccessibility(coreResult, pages, logger);
  applyPerformance(coreResult, pages, logger);
  applySecurity(coreResult, pages, logger);
  applyWww(coreResult, pages, logger);

  // Set scan_date to now (matches what upsertCoreResult does on update).
  (coreResult as any).updated = new Date().toISOString();

  return coreResult;
}

/**
 * Builds an in-memory Website entity populated with just enough metadata to
 * round-trip through website.serialized().
 */
export function buildWebsite(
  id: number,
  url: string,
  coreResult: CoreResult,
): Website {
  const website = new Website();
  website.id = id;
  website.url = url;
  website.branch = '';
  website.agency = '';
  website.bureau = '';
  website.topLevelDomain = url.split('.').pop() ?? '';
  website.coreResult = coreResult;
  return website;
}

/**
 * Returns the CSV column list to use.
 *
 * includeHidden: append the hidden-field expose names after the public order.
 */
export function buildColumnList(includeHidden: boolean): string[] {
  if (!includeHidden) {
    return CoreResult.snapshotColumnOrder;
  }
  const hidden = HIDDEN_EXPOSE_NAMES.filter(
    (col) => !CoreResult.snapshotColumnOrder.includes(col),
  );
  return [...CoreResult.snapshotColumnOrder, ...hidden];
}

/**
 * Serializes a Website (with its CoreResult) to a flat CSV row object.
 *
 * includeHidden: when true, forces hidden @Exclude()-ed columns to appear by
 * reading them directly from the raw CoreResult (class-transformer excludes
 * them from classToPlain even when HIDDEN_EXPOSE_NAMES requests them).
 */
export function serializeRow(
  website: Website,
  columns: string[],
  includeHidden: boolean,
): Record<string, unknown> {
  // Standard serialization via the same classToPlain pipeline used in
  // production (csv-serializer.ts and export-snapshot.ts).
  const serialized = website.serialized();

  if (includeHidden && website.coreResult) {
    // Manually inject hidden fields that classToPlain strips due to @Exclude().
    // We use classToPlain on just the CoreResult with excludeExtraneousValues
    // disabled so all @Expose()-ed values come through, then pick only the
    // ones that are absent from the standard serialization.
    const rawPlain = classToPlain(website.coreResult, {
      excludeExtraneousValues: false,
    });
    for (const col of HIDDEN_EXPOSE_NAMES) {
      if (!(col in serialized)) {
        // Fall back to the TypeScript property name by checking rawPlain keys
        // (class-transformer uses @Expose names as keys when they are set).
        serialized[col] = rawPlain[col] ?? null;
      }
    }
  }

  const row: Record<string, unknown> = {};
  for (const col of columns) {
    row[col] = formatValue(serialized[col]);
  }
  return row;
}

// ---------------------------------------------------------------------------
// Internal mapping functions (mirror CoreResultService without Postgres deps)
// ---------------------------------------------------------------------------

function applyPrimary(
  cr: CoreResult,
  pages: CoreResultPages,
  logger: Logger,
): void {
  cr.primaryScanStatus = pages.primary.status;
  if (pages.primary.status !== ScanStatus.Completed) {
    logger.warn(`primary scan not completed: ${pages.primary.status}`);
    clearPrimary(cr);
    return;
  }
  const r = pages.primary.result;
  if (r.dapScan) {
    cr.dapDetected = r.dapScan.dapDetected;
    cr.dapParameters = r.dapScan.dapParameters;
    cr.dapVersion = r.dapScan.dapVersion;
    cr.gaTagIds = r.dapScan.gaTagIds;
  }
  if (r.seoScan) {
    cr.mainElementFinalUrl = r.seoScan.mainElementFinalUrl;
    cr.ogArticleModifiedFinalUrl = r.seoScan.ogArticleModifiedFinalUrl;
    cr.ogArticlePublishedFinalUrl = r.seoScan.ogArticlePublishedFinalUrl;
    cr.ogDescriptionFinalUrl = r.seoScan.ogDescriptionFinalUrl;
    cr.ogTitleFinalUrl = r.seoScan.ogTitleFinalUrl;
    cr.canonicalLink = r.seoScan.canonicalLink;
    cr.pageTitle = r.seoScan.pageTitle;
    cr.metaDescriptionContent = r.seoScan.metaDescriptionContent;
    cr.metaKeywordsContent = r.seoScan.metaKeywordsContent;
    cr.ogImageContent = r.seoScan.ogImageContent;
    cr.ogTypeContent = r.seoScan.ogTypeContent;
    cr.ogUrlContent = r.seoScan.ogUrlContent;
    cr.htmlLangContent = r.seoScan.htmlLangContent;
    cr.hrefLangContent = r.seoScan.hrefLangContent;
    cr.dcDateContent = r.seoScan.dcDateContent;
    cr.dcDateCreatedContent = r.seoScan.dcDateCreatedContent;
    cr.dctermsCreatedContent = r.seoScan.dctermsCreatedContent;
    cr.revisedContent = r.seoScan.revisedContent;
    cr.lastModifiedContent = r.seoScan.lastModifiedContent;
    cr.dateContent = r.seoScan.dateContent;
  }
  if (r.thirdPartyScan) {
    cr.thirdPartyServiceCount = r.thirdPartyScan.thirdPartyServiceCount;
    cr.thirdPartyServiceDomains = r.thirdPartyScan.thirdPartyServiceDomains;
    cr.thirdPartyServiceUrls = r.thirdPartyScan.thirdPartyServiceUrls;
  }
  if (r.cookieScan) {
    cr.cookieDomains = r.cookieScan.domains;
  }
  if (r.urlScan) {
    cr.finalUrl = r.urlScan.finalUrl;
    cr.finalUrlBaseDomain = r.urlScan.finalUrlBaseDomain;
    cr.finalUrlWebsite = r.urlScan.finalUrlWebsite;
    cr.finalUrlTopLevelDomain = r.urlScan.finalUrlTopLevelDomain;
    cr.finalUrlIsLive = r.urlScan.finalUrlIsLive;
    cr.finalUrlMIMEType = r.urlScan.finalUrlMIMEType;
    cr.finalUrlStatusCode = r.urlScan.finalUrlStatusCode;
    cr.targetUrlRedirects = r.urlScan.targetUrlRedirects;
    cr.finalUrlPageHash = r.urlScan.finalUrlPageHash;
    cr.finalSiteName = cr.finalUrlWebsite
      ? cr.finalUrlWebsite.replace(/^www\./, '')
      : '';
  }
  if (r.uswdsScan) {
    cr.usaClasses = r.uswdsScan.usaClasses;
    cr.usaElementsUsed = r.uswdsScan.usaElementsUsed;
    cr.usaClassesUsed = r.uswdsScan.usaClassesUsed;
    cr.uswdsString = r.uswdsScan.uswdsString;
    cr.uswdsInlineCss = r.uswdsScan.uswdsInlineCss;
    cr.uswdsUsFlag = r.uswdsScan.uswdsUsFlag;
    cr.uswdsUsFlagInCss = r.uswdsScan.uswdsUsFlagInCss;
    cr.uswdsStringInCss = r.uswdsScan.uswdsStringInCss;
    cr.uswdsPublicSansFont = r.uswdsScan.uswdsPublicSansFont;
    cr.uswdsSemanticVersion = r.uswdsScan.uswdsSemanticVersion;
    cr.uswdsVersion = r.uswdsScan.uswdsVersion;
    cr.uswdsCount = r.uswdsScan.uswdsCount;
    cr.heresHowYouKnowBanner = r.uswdsScan.heresHowYouKnowBanner;
  }
  if (r.loginScan) {
    cr.loginDetected = r.loginScan.loginDetected;
    cr.loginProvider = r.loginScan.loginProvider;
  }
  cr.cms = r.cmsScan ? r.cmsScan.cms : null;
  if (r.requiredLinksScan) {
    cr.hyperlinkDomains = r.requiredLinksScan.hyperlinkDomains;
    cr.requiredLinksUrl = r.requiredLinksScan.requiredLinksUrl;
    cr.requiredLinksText = r.requiredLinksScan.requiredLinksText;
  }
  if (r.feedbackLinksScan) {
    cr.feedbackLinksText = r.feedbackLinksScan.feedbackLinksText;
  }
  if (r.searchScan) {
    cr.searchDetected = r.searchScan.searchDetected;
    cr.searchgov = r.searchScan.searchgov;
  }
  if (r.mobileScan) {
    cr.viewportMetaTag = r.mobileScan.viewportMetaTag;
  }
  if (r.toolingScan) {
    cr.tooling = r.toolingScan.tooling;
  }
}

function clearPrimary(cr: CoreResult): void {
  cr.dapDetected = null;
  cr.dapParameters = null;
  cr.dapVersion = null;
  cr.gaTagIds = null;
  cr.mainElementFinalUrl = null;
  cr.ogArticleModifiedFinalUrl = null;
  cr.ogArticlePublishedFinalUrl = null;
  cr.ogDescriptionFinalUrl = null;
  cr.ogTitleFinalUrl = null;
  cr.canonicalLink = null;
  cr.pageTitle = null;
  cr.metaDescriptionContent = null;
  cr.metaKeywordsContent = null;
  cr.ogImageContent = null;
  cr.ogTypeContent = null;
  cr.ogUrlContent = null;
  cr.htmlLangContent = null;
  cr.hrefLangContent = null;
  cr.dcDateContent = null;
  cr.dcDateCreatedContent = null;
  cr.dctermsCreatedContent = null;
  cr.revisedContent = null;
  cr.lastModifiedContent = null;
  cr.dateContent = null;
  cr.thirdPartyServiceCount = null;
  cr.thirdPartyServiceDomains = null;
  cr.thirdPartyServiceUrls = null;
  cr.cookieDomains = null;
  cr.finalUrl = null;
  cr.finalUrlBaseDomain = null;
  cr.finalUrlWebsite = null;
  cr.finalUrlTopLevelDomain = null;
  cr.finalUrlIsLive = null;
  cr.finalUrlMIMEType = null;
  cr.finalUrlStatusCode = null;
  cr.finalSiteName = null;
  cr.finalUrlPageHash = null;
  cr.targetUrlRedirects = null;
  cr.usaClasses = null;
  cr.usaElementsUsed = null;
  cr.usaClassesUsed = null;
  cr.uswdsString = null;
  cr.uswdsInlineCss = null;
  cr.uswdsUsFlag = null;
  cr.uswdsUsFlagInCss = null;
  cr.uswdsStringInCss = null;
  cr.uswdsPublicSansFont = null;
  cr.uswdsSemanticVersion = null;
  cr.uswdsVersion = null;
  cr.uswdsCount = null;
  cr.heresHowYouKnowBanner = null;
  cr.loginDetected = null;
  cr.loginProvider = null;
  cr.cms = null;
  cr.hyperlinkDomains = null;
  cr.requiredLinksUrl = null;
  cr.requiredLinksText = null;
  cr.feedbackLinksText = null;
  cr.searchDetected = null;
  cr.searchgov = null;
  cr.viewportMetaTag = null;
  cr.tooling = null;
}

function applyNotFound(
  cr: CoreResult,
  pages: CoreResultPages,
  logger: Logger,
): void {
  cr.notFoundScanStatus = pages.notFound.status;
  if (pages.notFound.status === ScanStatus.Completed) {
    cr.targetUrl404Test = pages.notFound.result.notFoundScan.targetUrl404Test;
  } else {
    logger.warn(`notFound scan not completed: ${pages.notFound.status}`);
    cr.targetUrl404Test = null;
  }
}

function applyRobotsTxt(
  cr: CoreResult,
  pages: CoreResultPages,
  logger: Logger,
): void {
  cr.robotsTxtScanStatus = pages.robotsTxt.status;
  if (pages.robotsTxt.status === ScanStatus.Completed) {
    const r = pages.robotsTxt.result.robotsTxtScan;
    cr.robotsTxtFinalUrlSize = r.robotsTxtFinalUrlSize;
    cr.robotsTxtCrawlDelay = r.robotsTxtCrawlDelay;
    cr.robotsTxtSitemapLocations = r.robotsTxtSitemapLocations;
    cr.robotsTxtFinalUrl = r.robotsTxtFinalUrl;
    cr.robotsTxtFinalUrlMimeType = r.robotsTxtFinalUrlMimeType;
    cr.robotsTxtStatusCode = r.robotsTxtStatusCode;
    cr.robotsTxtDetected = r.robotsTxtDetected;
  } else {
    logger.warn(`robotsTxt scan not completed: ${pages.robotsTxt.status}`);
    cr.robotsTxtFinalUrlSize = null;
    cr.robotsTxtCrawlDelay = null;
    cr.robotsTxtSitemapLocations = null;
    cr.robotsTxtFinalUrl = null;
    cr.robotsTxtFinalUrlMimeType = null;
    cr.robotsTxtStatusCode = null;
    cr.robotsTxtDetected = null;
  }
}

function applySitemapXml(
  cr: CoreResult,
  pages: CoreResultPages,
  logger: Logger,
): void {
  cr.sitemapXmlScanStatus = pages.sitemapXml.status;
  if (pages.sitemapXml.status === ScanStatus.Completed) {
    const r = pages.sitemapXml.result.sitemapXmlScan;
    cr.sitemapXmlFinalUrlFilesize = r.sitemapXmlFinalUrlFilesize;
    cr.sitemapXmlCount = r.sitemapXmlCount;
    cr.sitemapXmlPdfCount = r.sitemapXmlPdfCount;
    cr.sitemapXmlFinalUrl = r.sitemapXmlFinalUrl;
    cr.sitemapXmlFinalUrlMimeType = r.sitemapXmlFinalUrlMimeType;
    cr.sitemapXmlStatusCode = r.sitemapXmlStatusCode;
    cr.sitemapXmlDetected = r.sitemapXmlDetected;
    cr.sitemapXmlLastMod = r.sitemapXmlLastMod;
    cr.sitemapXmlPageHash = r.sitemapXmlPageHash;
  } else {
    logger.warn(`sitemapXml scan not completed: ${pages.sitemapXml.status}`);
    cr.sitemapXmlFinalUrlFilesize = null;
    cr.sitemapXmlCount = null;
    cr.sitemapXmlPdfCount = null;
    cr.sitemapXmlFinalUrl = null;
    cr.sitemapXmlFinalUrlMimeType = null;
    cr.sitemapXmlStatusCode = null;
    cr.sitemapXmlDetected = null;
    cr.sitemapXmlLastMod = null;
    cr.sitemapXmlPageHash = null;
  }
}

function applyDns(
  cr: CoreResult,
  pages: CoreResultPages,
  logger: Logger,
): void {
  cr.dnsScanStatus = pages.dns.status;
  if (pages.dns.status === ScanStatus.Completed) {
    cr.dnsIpv6 = pages.dns.result.dnsScan.ipv6;
    cr.dnsHostname = pages.dns.result.dnsScan.dnsHostname;
  } else {
    logger.warn(`dns scan not completed: ${pages.dns.status}`);
    cr.dnsIpv6 = null;
    cr.dnsHostname = null;
  }
}

function applyAccessibility(
  cr: CoreResult,
  pages: CoreResultPages,
  logger: Logger,
): void {
  cr.accessibilityScanStatus = pages.accessibility.status;
  if (pages.accessibility.status === ScanStatus.Completed) {
    cr.accessibilityResults =
      pages.accessibility.result.accessibilityScan.accessibilityResults;
    cr.accessibilityResultsList =
      pages.accessibility.result.accessibilityScan.accessibilityResultsList;
  } else {
    logger.warn(
      `accessibility scan not completed: ${pages.accessibility.status}`,
    );
    cr.accessibilityResults = null;
    cr.accessibilityResultsList = null;
  }
}

function applyPerformance(
  cr: CoreResult,
  pages: CoreResultPages,
  logger: Logger,
): void {
  cr.performanceScanStatus = pages.performance.status;
  if (pages.performance.status === ScanStatus.Completed) {
    cr.largestContentfulPaint =
      pages.performance.result.performanceScan.largestContentfulPaint;
    cr.cumulativeLayoutShift =
      pages.performance.result.performanceScan.cumulativeLayoutShift;
  } else {
    logger.warn(`performance scan not completed: ${pages.performance.status}`);
    cr.largestContentfulPaint = null;
    cr.cumulativeLayoutShift = null;
  }
}

function applySecurity(
  cr: CoreResult,
  pages: CoreResultPages,
  logger: Logger,
): void {
  cr.securityScanStatus = pages.security.status;
  if (pages.security.status === ScanStatus.Completed) {
    cr.httpsEnforced = pages.security.result.securityScan.httpsEnforced;
    cr.hsts = pages.security.result.securityScan.hsts;
  } else {
    logger.warn(`security scan not completed: ${pages.security.status}`);
    cr.httpsEnforced = null;
    cr.hsts = null;
  }
}

function applyWww(
  cr: CoreResult,
  pages: CoreResultPages,
  logger: Logger,
): void {
  cr.wwwScanStatus = pages.www.status;
  if (
    pages.www.status === ScanStatus.Completed
  ) {
    cr.wwwFinalUrl = pages.www.result.wwwScan.wwwFinalUrl;
    cr.wwwStatusCode = pages.www.result.wwwScan.wwwStatusCode;
    cr.wwwTitle = pages.www.result.wwwScan.wwwTitle;
    cr.wwwSame = pages.www.result.wwwScan.wwwSame;
  } else {
    cr.wwwFinalUrl = null;
    cr.wwwStatusCode = null;
    cr.wwwTitle = null;
    cr.wwwSame = null;
  }
}
