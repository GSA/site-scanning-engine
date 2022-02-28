import { classToPlain, Exclude, Expose, Transform } from 'class-transformer';

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import * as ScanPage from 'entities/scan-page.entity';
import { ScanStatus } from 'entities/scan-status';
import { BaseScan } from './scan-data.entity';
import { Website } from './website.entity';

// The CoreResult table includes all scan data. Create a type that represents this.
type CoreResultPages = {
  base: BaseScan;
  notFound: ScanPage.NotFoundPageScan;
  home: ScanPage.HomePageScan;
  robotsTxt: ScanPage.RobotsTxtPageScan;
  sitemapXml: ScanPage.SitemapXmlPageScan;
};

@Entity()
export class CoreResult {
  static fromScanData(websiteId: number, pages: CoreResultPages) {
    const coreResult = new CoreResult();

    const website = new Website();
    website.id = websiteId;
    coreResult.website = website;

    // Base scan data
    coreResult.targetUrlBaseDomain = pages.base.targetUrlBaseDomain;

    // Home page data
    coreResult.homeScanStatus = pages.home.status;
    if (pages.home.status !== ScanStatus.Completed) {
      coreResult.homeScanStatusDetails = pages.home.error;
    } else {
      const result = pages.home.result;
      // DAP scan
      coreResult.dapDetected = result.dapScan.dapDetected;
      coreResult.dapParameters = result.dapScan.dapParameters;

      // SEO scan
      coreResult.mainElementFinalUrl = result.seoScan.mainElementFinalUrl;
      coreResult.ogArticleModifiedFinalUrl =
        result.seoScan.ogArticleModifiedFinalUrl;
      coreResult.ogArticlePublishedFinalUrl =
        result.seoScan.ogArticlePublishedFinalUrl;
      coreResult.ogDescriptionFinalUrl = result.seoScan.ogDescriptionFinalUrl;
      coreResult.ogTitleFinalUrl = result.seoScan.ogTitleFinalUrl;

      // Third-party scan
      coreResult.thirdPartyServiceCount =
        result.thirdPartyScan.thirdPartyServiceCount;
      coreResult.thirdPartyServiceDomains =
        result.thirdPartyScan.thirdPartyServiceDomains;

      // Url scan
      coreResult.finalUrl = result.urlScan.finalUrl;
      coreResult.finalUrlBaseDomain = result.urlScan.finalUrlBaseDomain;
      coreResult.finalUrlIsLive = result.urlScan.finalUrlIsLive;
      coreResult.finalUrlMIMEType = result.urlScan.finalUrlMIMEType;
      coreResult.finalUrlSameDomain = result.urlScan.finalUrlSameDomain;
      coreResult.finalUrlSameWebsite = result.urlScan.finalUrlSameWebsite;
      coreResult.finalUrlStatusCode = result.urlScan.finalUrlStatusCode;
      coreResult.targetUrlRedirects = result.urlScan.targetUrlRedirects;

      coreResult.usaClasses = result.uswdsScan.usaClasses;
      coreResult.uswdsString = result.uswdsScan.uswdsString;
      coreResult.uswdsTables = result.uswdsScan.uswdsTables;
      coreResult.uswdsInlineCss = result.uswdsScan.uswdsInlineCss;
      coreResult.uswdsUsFlag = result.uswdsScan.uswdsUsFlag;
      coreResult.uswdsUsFlagInCss = result.uswdsScan.uswdsUsFlagInCss;
      coreResult.uswdsStringInCss = result.uswdsScan.uswdsStringInCss;
      coreResult.uswdsMerriweatherFont = result.uswdsScan.uswdsMerriweatherFont;
      coreResult.uswdsPublicSansFont = result.uswdsScan.uswdsPublicSansFont;
      coreResult.uswdsSourceSansFont = result.uswdsScan.uswdsSourceSansFont;
      coreResult.uswdsSemanticVersion = result.uswdsScan.uswdsSemanticVersion;
      coreResult.uswdsVersion = result.uswdsScan.uswdsVersion;
      coreResult.uswdsCount = result.uswdsScan.uswdsCount;
    }

    coreResult.notFoundScanStatus = pages.notFound.status;
    if (pages.notFound.status !== ScanStatus.Completed) {
      coreResult.notFoundScanStatusDetails = pages.notFound.error;
    } else {
      coreResult.targetUrl404Test =
        pages.notFound.result.notFoundScan.targetUrl404Test;
    }

    coreResult.robotsTxtScanStatus = pages.robotsTxt.status;
    if (pages.robotsTxt.status !== ScanStatus.Completed) {
      coreResult.robotsTxtScanStatusDetails = pages.robotsTxt.error;
    } else {
      const robotsTxt = pages.robotsTxt.result.robotsTxtScan;
      coreResult.robotsTxtFinalUrlSize = robotsTxt.robotsTxtFinalUrlSize;
      coreResult.robotsTxtCrawlDelay = robotsTxt.robotsTxtCrawlDelay;
      coreResult.robotsTxtSitemapLocations =
        robotsTxt.robotsTxtSitemapLocations;
      coreResult.robotsTxtFinalUrl = robotsTxt.robotsTxtFinalUrl;
      coreResult.robotsTxtFinalUrlLive = robotsTxt.robotsTxtFinalUrlLive;
      coreResult.robotsTxtTargetUrlRedirects =
        robotsTxt.robotsTxtTargetUrlRedirects;
      coreResult.robotsTxtFinalUrlMimeType =
        robotsTxt.robotsTxtFinalUrlMimeType;
      coreResult.robotsTxtStatusCode = robotsTxt.robotsTxtStatusCode;
      coreResult.robotsTxtDetected = robotsTxt.robotsTxtDetected;
    }

    coreResult.sitemapXmlScanStatus = pages.sitemapXml.status;
    if (pages.sitemapXml.status !== ScanStatus.Completed) {
      coreResult.sitemapXmlScanStatusDetails = pages.sitemapXml.error;
    } else {
      const sitemap = pages.sitemapXml.result.sitemapXmlScan;
      coreResult.sitemapXmlFinalUrlFilesize =
        sitemap.sitemapXmlFinalUrlFilesize;
      coreResult.sitemapXmlCount = sitemap.sitemapXmlCount;
      coreResult.sitemapXmlPdfCount = sitemap.sitemapXmlPdfCount;
      coreResult.sitemapXmlFinalUrl = sitemap.sitemapXmlFinalUrl;
      coreResult.sitemapXmlFinalUrlLive = sitemap.sitemapXmlFinalUrlLive;
      coreResult.sitemapTargetUrlRedirects = sitemap.sitemapTargetUrlRedirects;
      coreResult.sitemapXmlFinalUrlMimeType =
        sitemap.sitemapXmlFinalUrlMimeType;
      coreResult.sitemapXmlStatusCode = sitemap.sitemapXmlStatusCode;
      coreResult.sitemapXmlDetected = sitemap.sitemapXmlDetected;
    }

    return coreResult;
  }

  @PrimaryGeneratedColumn()
  @Exclude({ toPlainOnly: true })
  id: number;

  @CreateDateColumn()
  @Exclude({ toPlainOnly: true })
  created: string;

  @UpdateDateColumn()
  @Expose({ name: 'scan_date' })
  updated: string;

  @OneToOne(() => Website, (website) => website.coreResult)
  @JoinColumn()
  @Exclude({ toPlainOnly: true })
  website: Website;

  @Column()
  @Expose({ name: 'not_found_scan_status' })
  notFoundScanStatus: string;

  @Column()
  @Expose({ name: 'home_scan_status' })
  homeScanStatus: string;

  @Column()
  @Expose({ name: 'robots_txt_scan_status' })
  robotsTxtScanStatus: string;

  @Column()
  @Expose({ name: 'sitemap_xml_scan_status' })
  sitemapXmlScanStatus: string;

  @Column({ nullable: true })
  @Expose({ name: 'not_found_scan_status_details' })
  notFoundScanStatusDetails?: string;

  @Column({ nullable: true })
  @Expose({ name: 'home_scan_status_details' })
  homeScanStatusDetails?: string;

  @Column({ nullable: true })
  @Expose({ name: 'robots_txt_scan_status_details' })
  robotsTxtScanStatusDetails?: string;

  @Column({ nullable: true })
  @Expose({ name: 'sitemap_xml_scan_status_details' })
  sitemapXmlScanStatusDetails?: string;

  @Column()
  @Expose({ name: 'target_url_domain' })
  targetUrlBaseDomain: string;

  @Column({ nullable: true })
  @Expose({ name: 'final_url' })
  finalUrl?: string;

  @Column({ nullable: true })
  @Expose({ name: 'final_url_live' })
  finalUrlIsLive?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'final_url_domain' })
  finalUrlBaseDomain?: string;

  @Column({ nullable: true })
  @Expose({ name: 'final_url_mimetype' })
  finalUrlMIMEType?: string;

  @Column({ nullable: true })
  @Expose({ name: 'final_url_same_domain' })
  finalUrlSameDomain?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'final_url_status_code' })
  finalUrlStatusCode?: number;

  @Column({ nullable: true })
  @Expose({ name: 'final_url_same_website' })
  finalUrlSameWebsite?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'target_url_404_test' })
  targetUrl404Test?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'target_url_redirects' })
  targetUrlRedirects?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'uswds_usa_classes' })
  usaClasses?: number;

  @Column({ nullable: true })
  @Expose({ name: 'uswds_string' })
  uswdsString?: number;

  @Column({ nullable: true })
  @Expose({ name: 'uswds_tables' })
  uswdsTables?: number;

  @Column({ nullable: true })
  @Expose({ name: 'uswds_inline_css' })
  uswdsInlineCss?: number;

  @Column({ nullable: true })
  @Expose({ name: 'uswds_favicon' })
  uswdsUsFlag?: number;

  @Column({ nullable: true })
  @Expose({ name: 'uswds_string_in_css' })
  uswdsStringInCss?: number;

  @Column({ nullable: true })
  @Expose({ name: 'uswds_favicon_in_css' })
  uswdsUsFlagInCss?: number;

  @Column({ nullable: true })
  @Expose({ name: 'uswds_merriweather_font' })
  uswdsMerriweatherFont?: number;

  @Column({ nullable: true })
  @Expose({ name: 'uswds_publicsans_font' })
  uswdsPublicSansFont?: number;

  @Column({ nullable: true })
  @Expose({ name: 'uswds_source_sans_font' })
  uswdsSourceSansFont?: number;

  @Column({ nullable: true })
  @Expose({ name: 'uswds_semantic_version' })
  uswdsSemanticVersion?: string;

  @Column({ nullable: true })
  @Expose({ name: 'uswds_version' })
  uswdsVersion?: number;

  @Column({ nullable: true })
  @Expose({ name: 'uswds_count' })
  uswdsCount?: number;

  @Column({ nullable: true })
  @Expose({ name: 'dap_detected_final_url' })
  dapDetected?: boolean;

  // dap_parameters need to be parsed into JSON on serialization.
  @Column({ nullable: true })
  @Expose({ name: 'dap_parameters_final_url' })
  @Transform(
    (value) => {
      if (value) {
        const urlSearchParams = new URLSearchParams(value);
        const result = {};
        for (const [key, value] of urlSearchParams.entries()) {
          result[key] = value;
        }
        return result;
      }
      return value;
    },
    { toPlainOnly: true },
  )
  dapParameters?: string;

  @Column({ nullable: true })
  @Expose({ name: 'og_title_final_url' })
  ogTitleFinalUrl?: string;

  @Column({ nullable: true })
  @Expose({ name: 'og_description_final_url' })
  ogDescriptionFinalUrl?: string;

  @Column({ nullable: true })
  @Expose({ name: 'og_article_published_final_url' })
  ogArticlePublishedFinalUrl?: Date;

  @Column({ nullable: true })
  @Expose({ name: 'og_article_modified_final_url' })
  ogArticleModifiedFinalUrl?: Date;

  @Column({ nullable: true })
  @Expose({ name: 'main_element_present_final_url' })
  mainElementFinalUrl?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'robots_txt_final_url' })
  robotsTxtFinalUrl?: string;

  @Column({ nullable: true })
  @Expose({ name: 'robots_txt_final_url_status_code' })
  robotsTxtStatusCode?: number;

  @Column({ nullable: true })
  @Expose({ name: 'robots_txt_final_url_live' })
  robotsTxtFinalUrlLive?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'robots_txt_detected' })
  robotsTxtDetected?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'robots_txt_final_url_mimetype' })
  robotsTxtFinalUrlMimeType?: string;

  @Column({ nullable: true })
  @Expose({ name: 'robots_txt_target_url_redirects' })
  robotsTxtTargetUrlRedirects?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'robots_txt_final_url_filesize_in_bytes' })
  robotsTxtFinalUrlSize?: number;

  @Column({ nullable: true })
  @Expose({ name: 'robots_txt_crawl_delay' })
  robotsTxtCrawlDelay?: number;

  @Column({ nullable: true })
  @Expose({ name: 'robots_txt_sitemap_locations' })
  @Transform((value: string) => {
    if (value) {
      return value.split(',');
    } else {
      return null;
    }
  })
  robotsTxtSitemapLocations?: string;

  @Column({ nullable: true })
  @Expose({ name: 'sitemap_xml_detected' })
  sitemapXmlDetected?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'sitemap_xml_final_url_status_code' })
  sitemapXmlStatusCode?: number;

  @Column({ nullable: true })
  @Expose({ name: 'sitemap_xml_final_url' })
  sitemapXmlFinalUrl?: string;

  @Column({ nullable: true })
  @Expose({ name: 'sitemap_xml_final_url_live' })
  sitemapXmlFinalUrlLive?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'sitemap_xml_target_url_redirects' })
  sitemapTargetUrlRedirects?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'sitemap_xml_final_url_filesize_in_bytes' })
  sitemapXmlFinalUrlFilesize?: number;

  @Column({ nullable: true })
  @Expose({ name: 'sitemap_xml_final_url_mimetype' })
  sitemapXmlFinalUrlMimeType?: string;

  @Column({ nullable: true })
  @Expose({ name: 'sitemap_xml_count' })
  sitemapXmlCount?: number;

  @Column({ nullable: true })
  @Expose({ name: 'sitemap_xml_pdf_count' })
  sitemapXmlPdfCount?: number;

  @Column({ nullable: true })
  @Expose({ name: 'third_party_service_domains' })
  @Transform((value: string) => {
    if (value) {
      return value.split(',');
    } else {
      return null;
    }
  })
  thirdPartyServiceDomains?: string;

  @Column({ nullable: true })
  @Expose({ name: 'third_party_service_count' })
  thirdPartyServiceCount?: number;

  static getColumnNames(): string[] {
    // return class-transformer version of column names
    return Object.keys(classToPlain(new CoreResult()));
  }
}
