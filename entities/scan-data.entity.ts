export type BaseScan = {
  targetUrlBaseDomain: string;
};

export type UrlScan = {
  targetUrlRedirects: boolean;
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
};

export type LoginScan = {
  loginDetected: string;
};
