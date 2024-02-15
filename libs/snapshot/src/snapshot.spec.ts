import { mock, MockProxy } from 'jest-mock-extended';
import { StorageService } from '@app/storage';
import { Snapshot } from './snapshot';
import { Website } from 'entities/website.entity';
import { CoreResult } from 'entities/core-result.entity';
import { JsonSerializer } from './serializers/json-serializer';
import { CsvSerializer } from './serializers/csv-serializer';

describe('Snapshot', () => {
  let mockStorageService: MockProxy<StorageService>;
  let liveColumnOrder: string[];

  beforeEach(async () => {
    mockStorageService = mock<StorageService>();
    liveColumnOrder = [
      'target_url',
      'target_url_domain',
      'final_url',
      'final_url_domain',
      'final_url_website',
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
      'viewport_meta_tag',
      'cumulative_layout_shift',
      'largest_contentful_paint',
      'cookie_domains',
      'login_provider',
      'login_detected',
      'searchgov',
      'search_detected',
      'dap_detected_final_url',
      'dap_parameters_final_url',
    ];
  });

  it('archives prior snapshot', async () => {
    const dateString = new Date().toISOString();
    const website = new Website();
    website.id = 1;
    website.created = dateString;
    website.updated = dateString;
    website.coreResult = new CoreResult();

    const snapshot = new Snapshot(
      mockStorageService,
      [new JsonSerializer(liveColumnOrder), new CsvSerializer(liveColumnOrder)],
      [website],
      dateString,
      'weekly-snapshot',
    );

    await snapshot.archiveExisting();

    expect(mockStorageService.copy).toBeCalledWith(
      'weekly-snapshot.json',
      `archive/json/weekly-snapshot-${dateString}.json`,
    );
    expect(mockStorageService.copy).toBeCalledWith(
      'weekly-snapshot.csv',
      `archive/csv/weekly-snapshot-${dateString}.csv`,
    );
  });

  it('saves new snapshot', async () => {
    const dateString = new Date().toISOString();
    const website = new Website();
    website.id = 1;
    website.created = dateString;
    website.updated = dateString;
    website.coreResult = new CoreResult();

    const snapshot = new Snapshot(
      mockStorageService,
      [new JsonSerializer(liveColumnOrder), new CsvSerializer(liveColumnOrder)],
      [website],
      dateString,
      'weekly-snapshot',
    );

    await snapshot.saveNew();

    expect(mockStorageService.upload).toHaveBeenCalledTimes(2);
  });
});
