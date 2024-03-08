import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { JsonSerializer } from './json-serializer';

describe('JsonSerializer', () => {
  it('serializes an array containing one website', () => {
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
      'dns_scan_status',
      'not_found_scan_status',
      'robots_txt_scan_status',
      'sitemap_xml_scan_status',
      'ipv6',
      'hostname',
      'cms',
      'cloud_dot_gov_pages',
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
      'required_links_url',
      'required_links_text',
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
      'uswds_inline_css',
      'uswds_usa_classes',
      'uswds_string',
      'uswds_string_in_css',
      'uswds_semantic_version',
      'uswds_version',
      'uswds_count',
    ];

    const serializer = new JsonSerializer(liveColumnOrder);
    const website = new Website();
    const coreResult = new CoreResult();
    website.coreResult = coreResult;

    const result = serializer.serialize([website]);
    const expectedResult =
      '[{"source_list":null,"login":null,"third_party_service_domains":null,"cookie_domains":null,"required_links_url":null,"required_links_text":null,"robots_txt_sitemap_locations":null}]';

    expect(result).toEqual(expectedResult);
  });
});
