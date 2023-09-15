import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { JsonSerializer } from './json-serializer';

describe('JsonSerializer', () => {
  it('serializes an array containing one website', () => {
    const liveColumnOrder = [
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
      'cookie_domains',
      'login_provider',
      'login_detected',
      'searchgov',
      'search_detected',
      'dap_detected_final_url',
      'dap_parameters_final_url',
    ];

    const serializer = new JsonSerializer(liveColumnOrder);
    const website = new Website();
    const coreResult = new CoreResult();
    website.coreResult = coreResult;

    const result = serializer.serialize([website]);
    const expectedResult =
      '[{"source_list":null,"required_links_url":null,"required_links_text":null,"robots_txt_sitemap_locations":null,"third_party_service_domains":null,"cookie_domains":null,"login_detected":null}]';

    expect(result).toEqual(expectedResult);
  });
});
