import { ScanStatus } from 'entities/scan-status';
import * as ScanData from './scan-data.entity';

// A page scan includes scan data and a status of "completed", or a non-completed status.
type PageScan<T> =
  | {
      status: ScanStatus.Completed;
      result: T;
    }
  | {
      status: Exclude<ScanStatus, ScanStatus.Completed>;
      error: string;
    };

export type PrimaryScans = {
  urlScan: ScanData.UrlScan;
  dapScan: ScanData.DapScan;
  seoScan: ScanData.SeoScan;
  thirdPartyScan: ScanData.ThirdPartyScan;
  uswdsScan: ScanData.UswdsScan;
  loginScan: ScanData.LoginScan;
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
