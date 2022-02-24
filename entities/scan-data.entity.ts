export type UrlScan = {
  targetUrlRedirects: boolean;
  targetUrlBaseDomain: string;
  finalUrl: string;
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
};

export type ThirdPartyScan = {
  thirdPartyServiceDomains: string;
  thirdPartyServiceCount: number;
};

export type UswdsScan = {
  usaClasses: number;
  uswdsString: number;
  uswdsTables: number;
  uswdsInlineCss: number;
  uswdsUsFlag: number;
  uswdsUsFlagInCss: number;
  uswdsStringInCss: number;
  uswdsMerriweatherFont: number;
  uswdsPublicSansFont: number;
  uswdsSourceSansFont: number;
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