import { Injectable, Logger } from '@nestjs/common';
import { WebsiteService } from '@app/database/websites/websites.service';
import { StorageService } from '@app/storage';
import { DatetimeService } from 'libs/datetime/src';
import { Snapshot } from './snapshot';
import { JsonSerializer } from './serializers/json-serializer';
import { CsvSerializer } from './serializers/csv-serializer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SnapshotService {
  private logger = new Logger(SnapshotService.name);

  constructor(
    private storageService: StorageService,
    private websiteService: WebsiteService,
    private datetimeService: DatetimeService,
    private configService: ConfigService,
  ) {}

  private fileNameLive = this.configService.get<string>('fileNameLive');
  private fileNameAll = this.configService.get<string>('fileNameAll');
  private fileNameExperimental = this.configService.get<string>(
    'fileNameExperimental',
  );

  /**
   * weeklySnapshot is meant to be called weekly. It takes three snapshots:
   * - weekly-snapshot-all: contains all Website and CoreResults
   * - weekly-snapshot: contains only Website and CoreResults where
   *   CoreResult.finalUrlIsLive === true
   * - weekly-snapshot-experimental: contains all Website and CoreResults,
   *   including experimental fields
   *
   * If there are existing snapshots, they are copied to the archive bucket, and
   * named as such: <filename>-<date-one-week-previous>.
   *
   * The particular filename is specified by /config/snapshot.config.ts,
   * depending on whichever environment the application is running in.
   */
  async weeklySnapshot() {
    const date = this.datetimeService.now();
    date.setDate(date.getDate() - 7);
    const priorDate = date.toISOString();

    const liveColumnOrder = [
      'target_url',
      'target_url_domain',
      'target_url_top_level_domain',
      'final_url',
      'final_url_domain',
      'final_url_website',
      'final_url_top_level_domain',
      'canonical_link',
      'final_url_mimetype',
      'final_url_live',
      'target_url_redirects',
      'final_url_same_domain',
      'final_url_same_website',
      'target_url_agency_owner',
      'target_url_bureau_owner',
      'target_url_branch',
      'final_url_status_code',
      'target_url_404_test',
      'scan_date',
      'primary_scan_status',
      'not_found_scan_status',
      'robots_txt_scan_status',
      'sitemap_xml_scan_status',
      'dns_scan_status',
      'dns_ipv6',
      'dns_hostname',
      'source_list',
      'cms',
      'cloud_dot_gov_pages',
      'required_links_url',
      'required_links_text',
      'uswds_favicon',
      'uswds_favicon_in_css',
      'uswds_publicsans_font',
      'uswds_count',
      'uswds_usa_classes',
      'uswds_inline_css',
      'uswds_string',
      'uswds_string_in_css',
      'uswds_semantic_version',
      'uswds_version',
      'og_article_published_final_url',
      'og_article_modified_final_url',
      'og_title_final_url',
      'og_description_final_url',
      'main_element_present_final_url',
      'robots_txt_final_url',
      'robots_txt_detected',
      'robots_txt_final_url_live',
      'robots_txt_target_url_redirects',
      'robots_txt_final_url_status_code',
      'robots_txt_final_url_mimetype',
      'robots_txt_final_url_filesize_in_bytes',
      'robots_txt_crawl_delay',
      'robots_txt_sitemap_locations',
      'sitemap_xml_final_url',
      'sitemap_xml_detected',
      'sitemap_xml_final_url_live',
      'sitemap_xml_target_url_redirects',
      'sitemap_xml_final_url_status_code',
      'sitemap_xml_final_url_mimetype',
      'sitemap_xml_final_url_filesize_in_bytes',
      'sitemap_xml_count',
      'sitemap_xml_pdf_count',
      'third_party_service_domains',
      'third_party_service_count',
      'cookie_domains',
      'login_provider',
      'login_detected',
      'searchgov',
      'search_detected',
      'dap_detected_final_url',
      'dap_parameters_final_url',
    ];

    const allSnapshot = new Snapshot(
      this.storageService,
      [new JsonSerializer(liveColumnOrder), new CsvSerializer(liveColumnOrder)],
      await this.websiteService.findAllSnapshotResults(),
      priorDate,
      this.fileNameAll,
    );

    const liveSnapshot = new Snapshot(
      this.storageService,
      [new JsonSerializer(liveColumnOrder), new CsvSerializer(liveColumnOrder)],
      await this.websiteService.findLiveSnapshotResults(),
      priorDate,
      this.fileNameLive,
    );

    const experimentalColumnOrder = [
      'target_url',
      'target_url_domain',
      'target_url_top_level_domain',
      'final_url',
      'final_url_domain',
      'final_url_website',
      'final_url_top_level_domain',
      'canonical_link',
      'final_url_mimetype',
      'final_url_live',
      'target_url_redirects',
      'final_url_same_domain',
      'final_url_same_website',
      'target_url_agency_owner',
      'target_url_bureau_owner',
      'target_url_branch',
      'final_url_status_code',
      'target_url_404_test',
      'scan_date',
      'primary_scan_status',
      'not_found_scan_status',
      'robots_txt_scan_status',
      'sitemap_xml_scan_status',
      'dns_scan_status',
      'dns_ipv6',
      'dns_hostname',
      'source_list',
      'cms',
      'cloud_dot_gov_pages',
      'required_links_url',
      'required_links_text',
      'uswds_favicon',
      'uswds_favicon_in_css',
      'uswds_publicsans_font',
      'uswds_count',
      'uswds_usa_classes',
      'uswds_inline_css',
      'uswds_string',
      'uswds_string_in_css',
      'uswds_semantic_version',
      'uswds_version',
      'og_article_published_final_url',
      'og_article_modified_final_url',
      'og_title_final_url',
      'og_description_final_url',
      'main_element_present_final_url',
      'robots_txt_final_url',
      'robots_txt_detected',
      'robots_txt_final_url_live',
      'robots_txt_target_url_redirects',
      'robots_txt_final_url_status_code',
      'robots_txt_final_url_mimetype',
      'robots_txt_final_url_filesize_in_bytes',
      'robots_txt_crawl_delay',
      'robots_txt_sitemap_locations',
      'sitemap_xml_final_url',
      'sitemap_xml_detected',
      'sitemap_xml_final_url_live',
      'sitemap_xml_target_url_redirects',
      'sitemap_xml_final_url_status_code',
      'sitemap_xml_final_url_mimetype',
      'sitemap_xml_final_url_filesize_in_bytes',
      'sitemap_xml_count',
      'sitemap_xml_pdf_count',
      'third_party_service_domains',
      'third_party_service_count',
      'cookie_domains',
      'login_provider',
      'login_detected',
      'searchgov',
      'search_detected',
      'dap_detected_final_url',
      'dap_parameters_final_url',
      'security_scan_status',
      'https_enforced',
      'hsts_preloading',
    ];

    const experimentalSnapshot = new Snapshot(
      this.storageService,
      [
        new JsonSerializer(experimentalColumnOrder),
        new CsvSerializer(experimentalColumnOrder),
      ],
      await this.websiteService.findAllSnapshotResults(),
      priorDate,
      this.fileNameExperimental,
    );

    await Promise.all([
      await allSnapshot.archiveExisting(),
      await allSnapshot.saveNew(),
      await liveSnapshot.archiveExisting(),
      await liveSnapshot.saveNew(),
      await experimentalSnapshot.archiveExisting(),
      await experimentalSnapshot.saveNew(),
    ]);
  }
}
