import { classToPlain, Exclude, Expose, Transform } from 'class-transformer';
import { Logger } from 'pino';
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
export type CoreResultPages = {
  base: BaseScan;
  notFound: ScanPage.NotFoundPageScan;
  primary: ScanPage.PrimaryScan;
  robotsTxt: ScanPage.RobotsTxtPageScan;
  sitemapXml: ScanPage.SitemapXmlPageScan;
  dns: ScanPage.DnsPageScan;
};

@Entity()
export class CoreResult {
  @PrimaryGeneratedColumn()
  @Exclude({ toPlainOnly: true })
  id: number;

  @CreateDateColumn()
  @Exclude({ toPlainOnly: true })
  created: string;

  @UpdateDateColumn()
  @Expose({ name: 'scan_date' })
  updated: string;

  @OneToOne(() => Website, (website) => website.coreResult, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  @Exclude({ toPlainOnly: true })
  website: Website;

  @Column()
  @Expose({ name: 'not_found_scan_status' })
  notFoundScanStatus: string;

  @Column()
  @Expose({ name: 'primary_scan_status' })
  primaryScanStatus: string;

  @Column()
  @Expose({ name: 'robots_txt_scan_status' })
  robotsTxtScanStatus: string;

  @Column()
  @Expose({ name: 'sitemap_xml_scan_status' })
  sitemapXmlScanStatus: string;

  @Column({ nullable: true })
  @Expose({ name: 'dns_scan_status' })
  dnsScanStatus?: string;

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
  @Expose({ name: 'uswds_publicsans_font' })
  uswdsPublicSansFont?: number;

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

  @Column({ nullable: true })
  @Expose({ name: 'dns_ipv6' })
  dnsIpv6?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'login_detected' })
  loginDetected?: string;

  static getColumnNames(): string[] {
    // return class-transformer version of column names
    return Object.keys(classToPlain(new CoreResult()));
  }
}
