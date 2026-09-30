/**
 * core-result-mapper.ts
 *
 * Pure field-mapping functions: CoreResultPages → CoreResult fields.
 * No Postgres, no DI, no side effects.
 *
 * Used by:
 *   - CoreResultService (DB write path)
 *   - scan-to-csv.helper.ts (in-memory preview / test path)
 */

import { Logger } from '@nestjs/common';
import { CoreResult, CoreResultPages } from 'entities/core-result.entity';
import { ScanStatus } from 'entities/scan-status';

export function mapPrimary(
  cr: CoreResult,
  pages: CoreResultPages,
  logger: Logger,
): void {
  cr.primaryScanStatus = pages.primary.status;

  if (pages.primary.status !== ScanStatus.Completed) {
    logger.error({ msg: (pages.primary as any).error, page: 'primary' });
    clearPrimary(cr);
    return;
  }

  const r = pages.primary.result;

  // DAP
  cr.dapDetected = r.dapScan?.dapDetected ?? null;
  cr.dapParameters = r.dapScan?.dapParameters ?? null;
  cr.dapVersion = r.dapScan?.dapVersion ?? null;
  cr.gaTagIds = r.dapScan?.gaTagIds ?? null;

  // SEO
  cr.mainElementFinalUrl = r.seoScan?.mainElementFinalUrl ?? null;
  cr.ogArticleModifiedFinalUrl = r.seoScan?.ogArticleModifiedFinalUrl ?? null;
  cr.ogArticlePublishedFinalUrl = r.seoScan?.ogArticlePublishedFinalUrl ?? null;
  cr.ogDescriptionFinalUrl = r.seoScan?.ogDescriptionFinalUrl ?? null;
  cr.ogTitleFinalUrl = r.seoScan?.ogTitleFinalUrl ?? null;
  cr.canonicalLink = r.seoScan?.canonicalLink ?? null;
  cr.pageTitle = r.seoScan?.pageTitle ?? null;
  cr.metaDescriptionContent = r.seoScan?.metaDescriptionContent ?? null;
  cr.metaKeywordsContent = r.seoScan?.metaKeywordsContent ?? null;
  cr.ogImageContent = r.seoScan?.ogImageContent ?? null;
  cr.ogTypeContent = r.seoScan?.ogTypeContent ?? null;
  cr.ogUrlContent = r.seoScan?.ogUrlContent ?? null;
  cr.htmlLangContent = r.seoScan?.htmlLangContent ?? null;
  cr.hrefLangContent = r.seoScan?.hrefLangContent ?? null;
  // Experimental Fields #1368 Feb 2025
  cr.dcDateContent = r.seoScan?.dcDateContent ?? null;
  cr.dcDateCreatedContent = r.seoScan?.dcDateCreatedContent ?? null;
  cr.dctermsCreatedContent = r.seoScan?.dctermsCreatedContent ?? null;
  cr.revisedContent = r.seoScan?.revisedContent ?? null;
  cr.lastModifiedContent = r.seoScan?.lastModifiedContent ?? null;
  cr.dateContent = r.seoScan?.dateContent ?? null;

  // Third-party
  cr.thirdPartyServiceCount = r.thirdPartyScan?.thirdPartyServiceCount ?? null;
  cr.thirdPartyServiceDomains =
    r.thirdPartyScan?.thirdPartyServiceDomains ?? null;
  cr.thirdPartyServiceUrls = r.thirdPartyScan?.thirdPartyServiceUrls ?? null;

  // Cookies
  cr.cookieDomains = r.cookieScan?.domains ?? null;

  // URL
  cr.finalUrl = r.urlScan?.finalUrl ?? null;
  cr.finalUrlBaseDomain = r.urlScan?.finalUrlBaseDomain ?? null;
  cr.finalUrlWebsite = r.urlScan?.finalUrlWebsite ?? null;
  cr.finalUrlTopLevelDomain = r.urlScan?.finalUrlTopLevelDomain ?? null;
  cr.finalUrlIsLive = r.urlScan?.finalUrlIsLive ?? null;
  cr.finalUrlMIMEType = r.urlScan?.finalUrlMIMEType ?? null;
  cr.finalUrlStatusCode = r.urlScan?.finalUrlStatusCode ?? null;
  cr.targetUrlRedirects = r.urlScan?.targetUrlRedirects ?? null;
  cr.finalUrlPageHash = r.urlScan?.finalUrlPageHash ?? null;
  // Site name: finalUrlWebsite with leading www. stripped
  cr.finalSiteName = cr.finalUrlWebsite
    ? cr.finalUrlWebsite.replace(/^www\./, '')
    : r.urlScan
      ? ''
      : null;

  // USWDS
  cr.usaClasses = r.uswdsScan?.usaClasses ?? null;
  cr.usaElementsUsed = r.uswdsScan?.usaElementsUsed ?? null;
  cr.usaClassesUsed = r.uswdsScan?.usaClassesUsed ?? null;
  cr.uswdsString = r.uswdsScan?.uswdsString ?? null;
  cr.uswdsInlineCss = r.uswdsScan?.uswdsInlineCss ?? null;
  cr.uswdsUsFlag = r.uswdsScan?.uswdsUsFlag ?? null;
  cr.uswdsUsFlagInCss = r.uswdsScan?.uswdsUsFlagInCss ?? null;
  cr.uswdsStringInCss = r.uswdsScan?.uswdsStringInCss ?? null;
  cr.uswdsPublicSansFont = r.uswdsScan?.uswdsPublicSansFont ?? null;
  cr.uswdsSemanticVersion = r.uswdsScan?.uswdsSemanticVersion ?? null;
  cr.uswdsVersion = r.uswdsScan?.uswdsVersion ?? null;
  cr.uswdsCount = r.uswdsScan?.uswdsCount ?? null;
  cr.heresHowYouKnowBanner = r.uswdsScan?.heresHowYouKnowBanner ?? null;

  // Login
  cr.loginDetected = r.loginScan?.loginDetected ?? null;
  cr.loginProvider = r.loginScan?.loginProvider ?? null;

  // CMS
  cr.cms = r.cmsScan?.cms ?? null;

  // Required links
  cr.hyperlinkDomains = r.requiredLinksScan?.hyperlinkDomains ?? null;
  cr.requiredLinksUrl = r.requiredLinksScan?.requiredLinksUrl ?? null;
  cr.requiredLinksText = r.requiredLinksScan?.requiredLinksText ?? null;

  // Feedback links
  cr.feedbackLinksText = r.feedbackLinksScan?.feedbackLinksText ?? null;

  // Search
  cr.searchDetected = r.searchScan?.searchDetected ?? null;
  cr.searchgov = r.searchScan?.searchgov ?? null;

  // Mobile
  cr.viewportMetaTag = r.mobileScan?.viewportMetaTag ?? null;

  // Tooling
  cr.tooling = r.toolingScan?.tooling ?? null;
}

export function mapNotFound(
  cr: CoreResult,
  pages: CoreResultPages,
  logger: Logger,
): void {
  cr.notFoundScanStatus = pages.notFound.status;
  if (pages.notFound.status === ScanStatus.Completed) {
    cr.targetUrl404Test = pages.notFound.result.notFoundScan.targetUrl404Test;
  } else {
    logger.error({ msg: (pages.notFound as any).error, page: 'notFound' });
    cr.targetUrl404Test = null;
  }
}

export function mapRobotsTxt(
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
    logger.error({ msg: (pages.robotsTxt as any).error, page: 'robotsTxt' });
    cr.robotsTxtFinalUrlSize = null;
    cr.robotsTxtCrawlDelay = null;
    cr.robotsTxtSitemapLocations = null;
    cr.robotsTxtFinalUrl = null;
    cr.robotsTxtFinalUrlMimeType = null;
    cr.robotsTxtStatusCode = null;
    cr.robotsTxtDetected = null;
  }
}

export function mapSitemapXml(
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
    logger.error({ msg: (pages.sitemapXml as any).error, page: 'sitemap.xml' });
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

export function mapDns(
  cr: CoreResult,
  pages: CoreResultPages,
  logger: Logger,
): void {
  cr.dnsScanStatus = pages.dns.status;
  if (pages.dns.status === ScanStatus.Completed) {
    cr.dnsIpv6 = pages.dns.result.dnsScan.ipv6;
    cr.dnsHostname = pages.dns.result.dnsScan.dnsHostname;
  } else {
    logger.error({ msg: (pages.dns as any).error, page: 'dns' });
    cr.dnsIpv6 = null;
    cr.dnsHostname = null;
  }
}

export function mapAccessibility(
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
    logger.error({
      msg: (pages.accessibility as any).error,
      page: 'accessibility',
    });
    cr.accessibilityResults = null;
    cr.accessibilityResultsList = null;
  }
}

export function mapPerformance(
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
    logger.error({
      msg: (pages.performance as any).error,
      page: 'performance',
    });
    cr.largestContentfulPaint = null;
    cr.cumulativeLayoutShift = null;
  }
}

export function mapSecurity(
  cr: CoreResult,
  pages: CoreResultPages,
  logger: Logger,
): void {
  cr.securityScanStatus = pages.security.status;
  if (pages.security.status === ScanStatus.Completed) {
    cr.httpsEnforced = pages.security.result.securityScan.httpsEnforced;
    cr.hsts = pages.security.result.securityScan.hsts;
  } else {
    logger.error({ msg: (pages.security as any).error, page: 'security' });
    cr.httpsEnforced = null;
    cr.hsts = null;
  }
}

export function mapWww(
  cr: CoreResult,
  pages: CoreResultPages,
  logger: Logger,
): void {
  cr.wwwScanStatus = pages.www.status;
  if (pages.www.status === ScanStatus.Completed) {
    cr.wwwFinalUrl = pages.www.result.wwwScan.wwwFinalUrl;
    cr.wwwStatusCode = pages.www.result.wwwScan.wwwStatusCode;
    cr.wwwTitle = pages.www.result.wwwScan.wwwTitle;
    cr.wwwSame = pages.www.result.wwwScan.wwwSame;
  } else {
    // NotApplicable and all error states both clear the fields
    if (pages.www.status !== ScanStatus.NotApplicable) {
      logger.error({ msg: (pages.www as any).error, page: 'www' });
    }
    cr.wwwFinalUrl = null;
    cr.wwwStatusCode = null;
    cr.wwwTitle = null;
    cr.wwwSame = null;
  }
}

/**
 * Clears all primary-page fields to null. Called when the primary scan fails.
 * Exported so CoreResultService.writeFailedResult can reuse it.
 */
export function clearPrimary(cr: CoreResult): void {
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
