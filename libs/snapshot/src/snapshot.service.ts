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
  /**
   * weeklySnapshot is meant to be called weekly. It takes three snapshots:
   * - weekly-snapshot-all: contains all Website and CoreResults
   * - weekly-snapshot: contains only Website and CoreResults where
   *   CoreResult.finalUrlIsLive === true
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
      'target_url_redirects',
      'final_url',
      'final_url_domain',
      'final_url_top_level_domain',
      'final_url_website',
      'final_url_live',
      'final_url_status_code',
      'final_url_media_type',
      'final_url_same_domain',
      'final_url_same_website',
      'target_url_agency_owner',
      'target_url_bureau_owner',
      'target_url_branch',
      'target_url_404_test',
      'source_list',
      'public',
      'scan_date',
      'primary_scan_status',
      'accessibility_scan_status',
      'dns_scan_status',
      'not_found_scan_status',
      'performance_scan_status',
      'robots_txt_scan_status',
      'sitemap_xml_scan_status',
      'ipv6',
      'hostname',
      'cms',
      'login_provider',
      'login',
      'site_search',
      'search_dot_gov',
      'dap',
      'dap_parameters',
      'third_party_service_domains',
      'third_party_service_count',
      'cookie_domains',
      'viewport_meta_tag',
      'cumulative_layout_shift',
      'largest_contentful_paint',
      'required_links_url',
      'required_links_text',
      'title',
      'description',
      'og_title',
      'og_description',
      'og_article_published',
      'og_article_modified',
      'canonical_link',
      'main_element_present',
      'robots_txt_detected',
      'robots_txt_target_url_redirects',
      'robots_txt_final_url',
      'robots_txt_final_url_live',
      'robots_txt_final_url_status_code',
      'robots_txt_final_url_media_type',
      'robots_txt_final_url_filesize',
      'robots_txt_crawl_delay',
      'robots_txt_sitemap_locations',
      'sitemap_xml_detected',
      'sitemap_xml_target_url_redirects',
      'sitemap_xml_final_url',
      'sitemap_xml_final_url_live',
      'sitemap_xml_final_url_status_code',
      'sitemap_xml_final_url_media_type',
      'sitemap_xml_final_url_filesize',
      'sitemap_xml_count',
      'sitemap_xml_pdf_count',
      'uswds_favicon',
      'uswds_favicon_in_css',
      'uswds_publicsans_font',
      'uswds_inpage_css',
      'uswds_usa_classes',
      'uswds_string',
      'uswds_string_in_css',
      'uswds_semantic_version',
      'uswds_version',
      'uswds_count',
    ];

    const allWebsites = await this.websiteService.findAllSnapshotResults();
    this.logger.log(
      `Total number of all websites retrieved for snapshot: ${allWebsites.length}`,
    );

    const allSnapshot = new Snapshot(
      this.storageService,
      [new JsonSerializer(liveColumnOrder), new CsvSerializer(liveColumnOrder)],
      allWebsites,
      priorDate,
      this.fileNameAll,
    );

    const liveWebsites = await this.websiteService.findLiveSnapshotResults();
    this.logger.log(
      `Total number of live websites retrieved for snapshot: ${liveWebsites.length}`,
    );

    const liveSnapshot = new Snapshot(
      this.storageService,
      [new JsonSerializer(liveColumnOrder), new CsvSerializer(liveColumnOrder)],
      liveWebsites,
      priorDate,
      this.fileNameLive,
    );

    await Promise.all([
      await allSnapshot.archiveExisting(),
      await allSnapshot.saveNew(),
      await liveSnapshot.archiveExisting(),
      await liveSnapshot.saveNew(),
    ]);
  }
}
