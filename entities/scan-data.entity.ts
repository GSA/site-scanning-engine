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
  hreflangCodes: string;
  // #852 Begin March 2024 experimental fields
  metaKeywordsContent: string;
  metaRobotsContent: string;
  metaArticleSectionContent: string;
  metaArticleTagContent: string;
  ogImageFinalUrl: string;
  dctermsKeywordsContent: string;
  dcSubjectContent: string;
  dctermsSubjectContent: string;
  dctermsAudienceContent: string;
  dcTypeContent: string;
  dctermsTypeContent: string;
  dcDateContent: string;
  dcDateCreatedContent: string;
  dctermsCreatedContent: string;
  ogLocaleContent: string;
  ogSiteNameContent: string;
  ogTypeContent: string;
  ogUrlContent: string;
  ogImageAltContent: string;
  revisedContent: string;
  lastModifiedContent: string;
  languageContent: string;
  dateContent: string;
  subjectContent: string;
  ownerContent: string;
  pagenameContent: string;
  dcTitleContent: string;
  ogSiteName: string;
  itemTypeContent: string;
  itemScopeContent: string;
  itemPropContent: string;
  vocabContent: string;
  typeOfContent: string;
  propertyContent: string;
  contextContent: string;
  typeContent: string;
  htmlLangContent: string;
  hrefLangContent: string;
  meContent: string;
  // End March 2024 experimental fields
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
  accessibilityViolations: string;
  accessibilityViolationsList: string;
};

export type MobileScan = {
  viewportMetaTag: boolean;
};

export type PerformanceScan = {
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
};
