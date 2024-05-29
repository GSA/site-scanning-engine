export type BaseScan = {
  targetUrlBaseDomain: string;
};

export type UrlScan = {
  targetUrlRedirects: boolean;
  finalUrl: string;
  finalUrlWebsite: string;
  finalUrlTopLevelDomain: string;
  finalUrlMIMEType: string;
  finalUrlIsLive: boolean;
  finalUrlBaseDomain: string;
  finalUrlSameDomain: boolean;
  finalUrlSameWebsite: boolean;
  finalUrlStatusCode: number;
};

export type DapScan = {
  dapDetected: boolean;
  dapParameters: string;
};

export type SeoScan = {
  ogTitleFinalUrl: string;
  ogDescriptionFinalUrl: string;
  ogArticlePublishedFinalUrl: Date;
  ogArticleModifiedFinalUrl: Date;
  mainElementFinalUrl: boolean;
  canonicalLink: string;
  pageTitle: string;
  metaDescriptionContent: string;
  metaKeywordsContent: string;
  ogImageContent: string;
  ogTypeContent: string;
  ogUrlContent: string;
  htmlLangContent: string;
  hrefLangContent: string;
};

export type ThirdPartyScan = {
  thirdPartyServiceDomains: string;
  thirdPartyServiceCount: number;
};

export type CookieScan = {
  domains: string;
};

export type UswdsScan = {
  usaClasses: number;
  usaClassesUsed: string;
  uswdsString: number;
  uswdsInlineCss: number;
  uswdsUsFlag: number;
  uswdsUsFlagInCss: number;
  uswdsStringInCss: number;
  uswdsPublicSansFont: number;
  uswdsSemanticVersion: string;
  uswdsVersion: number;
  uswdsCount: number;
};

export type RobotsTxtScan = {
  robotsTxtFinalUrlSize?: number;
  robotsTxtCrawlDelay?: number;
  robotsTxtSitemapLocations?: string;
  robotsTxtFinalUrl: string;
  robotsTxtFinalUrlLive: boolean;
  robotsTxtTargetUrlRedirects: boolean;
  robotsTxtFinalUrlMimeType: string;
  robotsTxtStatusCode: number;
  robotsTxtDetected: boolean;
};

export type SitemapXmlScan = {
  sitemapXmlFinalUrlFilesize?: number;
  sitemapXmlCount?: number;
  sitemapXmlPdfCount?: number;
  sitemapXmlFinalUrl: string;
  sitemapXmlFinalUrlLive: boolean;
  sitemapTargetUrlRedirects: boolean;
  sitemapXmlFinalUrlMimeType: string;
  sitemapXmlStatusCode: number;
  sitemapXmlDetected: boolean;
};

export type NotFoundScan = {
  targetUrl404Test: boolean;
};

export type DnsScan = {
  ipv6: boolean;
  dnsHostname: string;
};

export type LoginScan = {
  loginDetected: string;
  loginProvider: string;
};

export type CmsScan = {
  cms: string;
};

export type RequiredLinksScan = {
  requiredLinksUrl: string;
  requiredLinksText: string;
};

export type SearchScan = {
  searchDetected: boolean;
  searchgov: boolean;
};

export type AccessibilityScan = {
  accessibilityResults: string;
  accessibilityResultsList: string;
};

export type MobileScan = {
  viewportMetaTag: boolean;
};

export type PerformanceScan = {
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
};

export type SecurityScan = {
  httpsEnforced: boolean;
  hsts: boolean;
};
