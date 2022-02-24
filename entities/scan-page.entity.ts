import { ScanStatus } from '@app/core-scanner/scan-status';
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

export type HomePageScans = {
  urlScan: ScanData.UrlScan;
  dapScan: ScanData.DapScan;
  seoScan: ScanData.SeoScan;
  thirdPartyScan: ScanData.ThirdPartyScan;
  uswdsScan: ScanData.UswdsScan;
};
export type HomePageScan = PageScan<HomePageScans>;

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
