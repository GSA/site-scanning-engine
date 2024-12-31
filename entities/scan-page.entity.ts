import { AnyFailureStatus, AnySuccessfulStatus } from 'entities/scan-status';
import * as ScanData from './scan-data.entity';

export type PageScanSuccess<T> = {
  status: AnySuccessfulStatus;
  result: T;
  error?: null;
}

export type PageScanFailure = {
  status: AnyFailureStatus;
  error: string;
}

// A page scan includes scan data and a status of "completed", or a non-completed status.
export type PageScan<T> = PageScanSuccess<T> | PageScanFailure;

export type PrimaryScans = {
  urlScan: ScanData.UrlScan;
  dapScan: ScanData.DapScan;
  seoScan: ScanData.SeoScan;
  thirdPartyScan: ScanData.ThirdPartyScan;
  cookieScan: ScanData.CookieScan;
  uswdsScan: ScanData.UswdsScan;
  loginScan: ScanData.LoginScan;
  cmsScan: ScanData.CmsScan;
  requiredLinksScan: ScanData.RequiredLinksScan;
  searchScan: ScanData.SearchScan;
  mobileScan: ScanData.MobileScan;
};
export type PrimaryScan = PageScan<PrimaryScans>;

export type RobotsTxtPageScans = {
  robotsTxtScan: ScanData.RobotsTxtScan;
};
export type RobotsTxtPageScan = PageScan<RobotsTxtPageScans>;

export type SitemapXmlPageScans = {
  sitemapXmlScan: ScanData.SitemapXmlScan;
};
export type SitemapXmlPageScan = PageScan<SitemapXmlPageScans>;

export type NotFoundPageScans = {
  notFoundScan: ScanData.NotFoundScan;
};
export type NotFoundPageScan = PageScan<NotFoundPageScans>;

export type DnsScans = {
  dnsScan: ScanData.DnsScan;
};
export type DnsPageScan = PageScan<DnsScans>;

export type AccessibilityScans = {
  accessibilityScan: ScanData.AccessibilityScan;
};

export type AccessibilityPageScan = PageScan<AccessibilityScans>;

export type PerformanceScans = {
  performanceScan: ScanData.PerformanceScan;
};

export type PerformancePageScan = PageScan<PerformanceScans>;

export type SecurityScans = {
  securityScan: ScanData.SecurityScan;
};

export type SecurityPageScan = PageScan<SecurityScans>;

export type WwwScans = {
  wwwScan: ScanData.WwwScan;
};

export type wwwPageScan = PageScan<WwwScans>;