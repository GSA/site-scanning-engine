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
  accessibility: ScanPage.AccessibilityPageScan;
  performance: ScanPage.PerformancePageScan;
  security: ScanPage.SecurityPageScan;
  www: ScanPage.wwwPageScan;
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
  @Expose({ name: 'initial_base_domain' })
  targetUrlBaseDomain: string;

  @Column({ nullable: true })
  @Expose({ name: 'url' })
  finalUrl?: string;

  @Column({ nullable: true })
  @Expose({ name: 'initial_url' })
  initialUrl?: string;

  @Column({ nullable: true })
  @Expose({ name: 'live' })
  finalUrlIsLive?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'filter' })
  filter?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'base_domain' })
  finalUrlBaseDomain?: string;

  @Column({ nullable: true })
  @Expose({ name: 'name' })
  finalSiteName?: string;

  @Column({ nullable: true })
  @Expose({ name: 'page_hash' })
  finalUrlPageHash?: string;

  @Column({ nullable: true })
  @Expose({ name: 'media_type' })
  finalUrlMIMEType?: string;

  @Column({ nullable: true })
  @Expose({ name: 'status_code' })
  finalUrlStatusCode?: number;

  @Column({ nullable: true })
  @Expose({ name: '404_test' })
  targetUrl404Test?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'redirect' })
  targetUrlRedirects?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'uswds_usa_classes' })
  usaClasses?: number;

  @Column({ nullable: true })
  @Expose({ name: 'uswds_string' })
  uswdsString?: number;

  @Column({ nullable: true })
  @Expose({ name: 'uswds_inpage_css' })
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
  @Expose({ name: 'dap' })
  dapDetected?: boolean;

  // dap_parameters need to be parsed into JSON on serialization.
  @Column({ nullable: true })
  @Expose({ name: 'dap_parameters' })
  @Transform(
    ({ value }: { value: string }) => {
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
  @Expose({ name: 'dap_version' })
  dapVersion?: string;

  @Column({ nullable: true })
  @Expose({ name: 'ga_tag_id' })
  gaTagIds?: string;

  @Column({ nullable: true })
  @Expose({ name: 'og_title' })
  ogTitleFinalUrl?: string;

  @Column({ nullable: true })
  @Expose({ name: 'og_description' })
  ogDescriptionFinalUrl?: string;

  @Column({ nullable: true })
  @Expose({ name: 'og_article_published' })
  ogArticlePublishedFinalUrl?: Date;

  @Column({ nullable: true })
  @Expose({ name: 'og_article_modified' })
  ogArticleModifiedFinalUrl?: Date;

  @Column({ nullable: true })
  @Expose({ name: 'main_element_present' })
  mainElementFinalUrl?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'robots_txt_url' })
  robotsTxtFinalUrl?: string;

  @Column({ nullable: true })
  @Expose({ name: 'robots_txt_status_code' })
  robotsTxtStatusCode?: number;

  @Column({ nullable: true })
  @Expose({ name: 'robots_txt_detected' })
  robotsTxtDetected?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'robots_txt_media_type' })
  robotsTxtFinalUrlMimeType?: string;

  @Column({ nullable: true })
  @Expose({ name: 'robots_txt_filesize' })
  robotsTxtFinalUrlSize?: number;

  @Column({ nullable: true })
  @Expose({ name: 'robots_txt_crawl_delay' })
  robotsTxtCrawlDelay?: number;

  @Column({ nullable: true })
  @Expose({ name: 'robots_txt_sitemap_locations' })
  @Transform(({ value }: { value: string }) => {
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
  @Expose({ name: 'sitemap_xml_status_code' })
  sitemapXmlStatusCode?: number;

  @Column({ nullable: true })
  @Expose({ name: 'sitemap_xml_url' })
  sitemapXmlFinalUrl?: string;

  @Column({ nullable: true })
  @Expose({ name: 'sitemap_xml_filesize' })
  sitemapXmlFinalUrlFilesize?: number;

  @Column({ nullable: true })
  @Expose({ name: 'sitemap_xml_media_type' })
  sitemapXmlFinalUrlMimeType?: string;

  @Column({ nullable: true })
  @Expose({ name: 'sitemap_xml_count' })
  sitemapXmlCount?: number;

  @Column({ nullable: true })
  @Expose({ name: 'sitemap_xml_pdf_count' })
  sitemapXmlPdfCount?: number;

  @Column({ nullable: true })
  @Expose({ name: 'sitemap_xml_lastmod' })
  sitemapXmlLastMod?: string;

  @Column({ nullable: true })
  @Expose({ name: 'sitemap_xml_page_hash' })
  sitemapXmlPageHash?: string;

  @Column({ nullable: true })
  @Expose({ name: 'third_party_service_domains' })
  @Transform(({ value }: { value: string }) => {
    if (value) {
      return value.split(',');
    } else {
      return null;
    }
  })
  thirdPartyServiceDomains?: string;

  @Column({ nullable: true })
  @Expose({ name: 'third_party_service_urls' })
  @Transform(({ value }: { value: string }) => {
    if (value) {
      return value.split(',');
    } else {
      return null;
    }
  })
  thirdPartyServiceUrls?: string;

  @Column({ nullable: true })
  @Expose({ name: 'third_party_service_count' })
  thirdPartyServiceCount?: number;

  @Column({ nullable: true })
  @Expose({ name: 'cookie_domains' })
  @Transform(({ value }: { value: string }) => {
    if (value) {
      return value.split(',');
    } else {
      return null;
    }
  })
  cookieDomains?: string;

  @Column({ nullable: true })
  @Expose({ name: 'ipv6' })
  dnsIpv6?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'login' })
  @Transform(({ value }: { value: string }) => {
    if (value) {
      return value.split(',');
    } else {
      return null;
    }
  })
  loginDetected?: string;

  @Column({ nullable: true })
  @Expose({ name: 'hostname' })
  dnsHostname?: string;

  @Column({ nullable: true })
  @Expose({ name: 'domain' })
  finalUrlWebsite?: string;

  @Column({ nullable: true })
  @Expose({ name: 'top_level_domain' })
  finalUrlTopLevelDomain?: string;

  @Column({ nullable: true })
  @Expose({ name: 'canonical_link' })
  canonicalLink?: string;

  @Column({ nullable: true })
  @Expose({ name: 'cms' })
  cms?: string;

  @Column({ nullable: true })
  @Expose({ name: 'required_links_url' })
  @Transform(({ value }: { value: string }) => {
    if (value) {
      return value.split(',');
    } else {
      return null;
    }
  })
  requiredLinksUrl?: string;

  @Column({ nullable: true })
  @Expose({ name: 'required_links_text' })
  @Transform(({ value }: { value: string }) => {
    if (value) {
      return value.split(',');
    } else {
      return null;
    }
  })
  requiredLinksText?: string;

  @Column({ nullable: true })
  @Expose({ name: 'login_provider' })
  loginProvider?: string;

  @Column({ nullable: true })
  @Expose({ name: 'site_search' })
  searchDetected?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'search_dot_gov' })
  searchgov?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'accessibility_scan_status' })
  accessibilityScanStatus?: string;

  @Column({ nullable: true })
  @Expose({ name: 'accessibility_violations' })
  accessibilityResults?: string;

  @Column({ nullable: true })
  @Expose({ name: 'accessibility_results_list' })
  @Exclude()
  @Transform(({ value }: { value: string }) => {
    if (value) {
      return value.split(',');
    } else {
      return null;
    }
  })
  accessibilityResultsList?: string;

  @Column({ nullable: true })
  @Expose({ name: 'viewport_meta_tag' })
  viewportMetaTag: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'title' })
  pageTitle?: string;

  @Column({ nullable: true })
  @Expose({ name: 'description' })
  metaDescriptionContent?: string;

  @Column({ nullable: true })
  @Expose({ name: 'performance_scan_status' })
  performanceScanStatus?: string;

  @Column({ nullable: true, type: 'decimal' })
  @Expose({ name: 'largest_contentful_paint' })
  largestContentfulPaint?: number;

  @Column({ nullable: true, type: 'decimal' })
  @Expose({ name: 'cumulative_layout_shift' })
  cumulativeLayoutShift?: number;

  @Column({ nullable: true })
  @Expose({ name: 'keywords' })
  metaKeywordsContent?: string;

  @Column({ nullable: true })
  @Expose({ name: 'og_image' })
  ogImageContent?: string;

  @Column({ nullable: true })
  @Expose({ name: 'og_type' })
  ogTypeContent?: string;

  @Column({ nullable: true })
  @Expose({ name: 'og_url' })
  ogUrlContent?: string;

  @Column({ nullable: true })
  @Expose({ name: 'language' })
  htmlLangContent?: string;

  @Column({ nullable: true })
  @Expose({ name: 'language_link' })
  hrefLangContent?: string;

  @Column({ nullable: true })
  @Expose({ name: 'security_scan_status' })
  securityScanStatus?: string;

  @Column({ nullable: true })
  @Expose({ name: 'https_enforced' })
  httpsEnforced?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'hsts' })
  hsts?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'uswds_usa_class_list' })
  @Transform(({ value }: { value: string }) => {
    if (value) {
      return value.split(',');
    } else {
      return null;
    }
  })
  usaClassesUsed?: string;

  @Column({ nullable: true })
  @Expose({ name: 'uswds_banner_heres_how' })
  heresHowYouKnowBanner?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'www_scan_status' })
  wwwScanStatus?: string;

  @Column({ nullable: true })
  @Expose({ name: 'www_url' })
  wwwFinalUrl?: string;

  @Column({ nullable: true })
  @Expose({ name: 'www_status_code' })
  wwwStatusCode?: number;

  @Column({ nullable: true })
  @Expose({ name: 'www_title' })
  wwwTitle?: string;

  @Column({ nullable: true })
  @Expose({ name: 'www_same' })
  wwwSame?: boolean;

  static getColumnNames(): string[] {
    // return class-transformer version of column names
    return Object.keys(classToPlain(new CoreResult()));
  }

  static snapshotColumnOrder = [
    'name',
    'initial_url',
    'initial_domain',
    'initial_base_domain',
    'initial_top_level_domain',
    'redirect',
    'url',
    'domain',
    'base_domain',
    'top_level_domain',
    'live',
    'filter',
    'status_code',
    'media_type',
    'agency',
    'bureau',
    'branch',
    '404_test',
    'source_list',
    'public',
    'scan_date',
    'primary_scan_status',
    'accessibility_scan_status',
    'dns_scan_status',
    'not_found_scan_status',
    'performance_scan_status',
    'robots_txt_scan_status',
    'security_scan_status',
    'sitemap_xml_scan_status',
    'www_scan_status',
    'page_hash',
    'accessibility_violations',
    'ipv6',
    'hostname',
    'cms',
    'login_provider',
    'login',
    'site_search',
    'search_dot_gov',
    'dap',
    'dap_parameters',
    'dap_version',
    'ga_tag_id',
    'third_party_service_domains',
    'third_party_service_urls',
    'third_party_service_count',
    'cookie_domains',
    'viewport_meta_tag',
    'cumulative_layout_shift',
    'largest_contentful_paint',
    'required_links_url',
    'required_links_text',
    'https_enforced',
    'hsts',
    'title',
    'description',
    'keywords',
    'og_title',
    'og_description',
    'og_article_published',
    'og_article_modified',
    'og_image',
    'og_type',
    'og_url',
    'canonical_link',
    'language',
    'language_link',
    'main_element_present',
    'robots_txt_detected',
    'robots_txt_url',
    'robots_txt_status_code',
    'robots_txt_media_type',
    'robots_txt_filesize',
    'robots_txt_crawl_delay',
    'robots_txt_sitemap_locations',
    'sitemap_xml_detected',
    'sitemap_xml_url',
    'sitemap_xml_status_code',
    'sitemap_xml_media_type',
    'sitemap_xml_filesize',
    'sitemap_xml_count',
    'sitemap_xml_lastmod',
    'sitemap_xml_pdf_count',
    'sitemap_xml_page_hash',
    'uswds_favicon',
    'uswds_favicon_in_css',
    'uswds_publicsans_font',
    'uswds_inpage_css',
    'uswds_usa_class_list',
    'uswds_banner_heres_how',
    'uswds_usa_classes',
    'uswds_string',
    'uswds_string_in_css',
    'uswds_semantic_version',
    'uswds_version',
    'uswds_count',
    'www_url',
    'www_status_code',
    'www_title',
  ];
}
