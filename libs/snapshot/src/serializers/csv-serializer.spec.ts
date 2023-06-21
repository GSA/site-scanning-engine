import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { CsvSerializer } from './csv-serializer';
import { Snapshot } from '../snapshot';

describe('CsvSerializer', () => {
  it('returns headers when no data is passed', () => {
    const serializer = new CsvSerializer(Snapshot.CSV_COLUMN_ORDER);

    const result = serializer.serialize([]);
    const expectedResult =
      '"target_url","target_url_domain","final_url","final_url_domain","final_url_website","canonical_link","final_url_mimetype","final_url_live","target_url_redirects","final_url_same_domain","final_url_same_website","target_url_agency_owner","target_url_bureau_owner","target_url_branch","final_url_status_code","target_url_404_test","scan_date","primary_scan_status","not_found_scan_status","robots_txt_scan_status","sitemap_xml_scan_status","dns_scan_status","dns_ipv6","hsts","dns_hostname","source_list","cms","cloud_dot_gov_pages","required_links_url","required_links_text","uswds_favicon","uswds_favicon_in_css","uswds_publicsans_font","uswds_count","uswds_usa_classes","uswds_inline_css","uswds_string","uswds_string_in_css","uswds_semantic_version","uswds_version","og_article_published_final_url","og_article_modified_final_url","og_title_final_url","og_description_final_url","main_element_present_final_url","robots_txt_final_url","robots_txt_detected","robots_txt_final_url_live","robots_txt_target_url_redirects","robots_txt_final_url_status_code","robots_txt_final_url_mimetype","robots_txt_final_url_filesize_in_bytes","robots_txt_crawl_delay","robots_txt_sitemap_locations","sitemap_xml_final_url","sitemap_xml_detected","sitemap_xml_final_url_live","sitemap_xml_target_url_redirects","sitemap_xml_final_url_status_code","sitemap_xml_final_url_mimetype","sitemap_xml_final_url_filesize_in_bytes","sitemap_xml_count","sitemap_xml_pdf_count","third_party_service_domains","third_party_service_count","login_provider","login_detected","dap_detected_final_url","dap_parameters_final_url"';

    expect(result).toEqual(expectedResult);
  });

  it('serializes an array containing one website', () => {
    const serializer = new CsvSerializer(Snapshot.CSV_COLUMN_ORDER);
    const website = new Website();
    const coreResult = new CoreResult();
    website.url = '18f.gov';
    website.coreResult = coreResult;

    const result = serializer.serialize([website]);
    const expectedResult =
      '"target_url","target_url_domain","final_url","final_url_domain","final_url_website","canonical_link","final_url_mimetype","final_url_live","target_url_redirects","final_url_same_domain","final_url_same_website","target_url_agency_owner","target_url_bureau_owner","target_url_branch","final_url_status_code","target_url_404_test","scan_date","primary_scan_status","not_found_scan_status","robots_txt_scan_status","sitemap_xml_scan_status","dns_scan_status","dns_ipv6","hsts","dns_hostname","source_list","cms","cloud_dot_gov_pages","required_links_url","required_links_text","uswds_favicon","uswds_favicon_in_css","uswds_publicsans_font","uswds_count","uswds_usa_classes","uswds_inline_css","uswds_string","uswds_string_in_css","uswds_semantic_version","uswds_version","og_article_published_final_url","og_article_modified_final_url","og_title_final_url","og_description_final_url","main_element_present_final_url","robots_txt_final_url","robots_txt_detected","robots_txt_final_url_live","robots_txt_target_url_redirects","robots_txt_final_url_status_code","robots_txt_final_url_mimetype","robots_txt_final_url_filesize_in_bytes","robots_txt_crawl_delay","robots_txt_sitemap_locations","sitemap_xml_final_url","sitemap_xml_detected","sitemap_xml_final_url_live","sitemap_xml_target_url_redirects","sitemap_xml_final_url_status_code","sitemap_xml_final_url_mimetype","sitemap_xml_final_url_filesize_in_bytes","sitemap_xml_count","sitemap_xml_pdf_count","third_party_service_domains","third_party_service_count","login_provider","login_detected","dap_detected_final_url","dap_parameters_final_url"\r\n"18f.gov",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,';

    expect(result).toEqual(expectedResult);
  });

  it('serializes an array containing more than one website', () => {
    const serializer = new CsvSerializer(Snapshot.CSV_COLUMN_ORDER);
    const firstWebsite = new Website();
    const firstCoreResult = new CoreResult();
    firstWebsite.url = '18f.gov';
    firstWebsite.coreResult = firstCoreResult;
    const secondWebsite = new Website();
    const secondCoreResult = new CoreResult();
    secondWebsite.url = 'nasa.gov';
    secondWebsite.coreResult = secondCoreResult;

    const result = serializer.serialize([firstWebsite, secondWebsite]);
    const expectedResult =
      '"target_url","target_url_domain","final_url","final_url_domain","final_url_website","canonical_link","final_url_mimetype","final_url_live","target_url_redirects","final_url_same_domain","final_url_same_website","target_url_agency_owner","target_url_bureau_owner","target_url_branch","final_url_status_code","target_url_404_test","scan_date","primary_scan_status","not_found_scan_status","robots_txt_scan_status","sitemap_xml_scan_status","dns_scan_status","dns_ipv6","hsts","dns_hostname","source_list","cms","cloud_dot_gov_pages","required_links_url","required_links_text","uswds_favicon","uswds_favicon_in_css","uswds_publicsans_font","uswds_count","uswds_usa_classes","uswds_inline_css","uswds_string","uswds_string_in_css","uswds_semantic_version","uswds_version","og_article_published_final_url","og_article_modified_final_url","og_title_final_url","og_description_final_url","main_element_present_final_url","robots_txt_final_url","robots_txt_detected","robots_txt_final_url_live","robots_txt_target_url_redirects","robots_txt_final_url_status_code","robots_txt_final_url_mimetype","robots_txt_final_url_filesize_in_bytes","robots_txt_crawl_delay","robots_txt_sitemap_locations","sitemap_xml_final_url","sitemap_xml_detected","sitemap_xml_final_url_live","sitemap_xml_target_url_redirects","sitemap_xml_final_url_status_code","sitemap_xml_final_url_mimetype","sitemap_xml_final_url_filesize_in_bytes","sitemap_xml_count","sitemap_xml_pdf_count","third_party_service_domains","third_party_service_count","login_provider","login_detected","dap_detected_final_url","dap_parameters_final_url"\r\n"18f.gov",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\r\n"nasa.gov",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,';

    expect(result).toEqual(expectedResult);
  });

  it('serializes an array containing one website with dap parameters', () => {
    const serializer = new CsvSerializer(Snapshot.CSV_COLUMN_ORDER);
    const website = new Website();
    const coreResult = new CoreResult();
    coreResult.dapParameters = 'agency=GSA&subagency=TTS,18F';
    website.url = '18f.gov';
    website.coreResult = coreResult;

    const result = serializer.serialize([website]);
    const expectedResult =
      '"target_url","target_url_domain","final_url","final_url_domain","final_url_website","canonical_link","final_url_mimetype","final_url_live","target_url_redirects","final_url_same_domain","final_url_same_website","target_url_agency_owner","target_url_bureau_owner","target_url_branch","final_url_status_code","target_url_404_test","scan_date","primary_scan_status","not_found_scan_status","robots_txt_scan_status","sitemap_xml_scan_status","dns_scan_status","dns_ipv6","hsts","dns_hostname","source_list","cms","cloud_dot_gov_pages","required_links_url","required_links_text","uswds_favicon","uswds_favicon_in_css","uswds_publicsans_font","uswds_count","uswds_usa_classes","uswds_inline_css","uswds_string","uswds_string_in_css","uswds_semantic_version","uswds_version","og_article_published_final_url","og_article_modified_final_url","og_title_final_url","og_description_final_url","main_element_present_final_url","robots_txt_final_url","robots_txt_detected","robots_txt_final_url_live","robots_txt_target_url_redirects","robots_txt_final_url_status_code","robots_txt_final_url_mimetype","robots_txt_final_url_filesize_in_bytes","robots_txt_crawl_delay","robots_txt_sitemap_locations","sitemap_xml_final_url","sitemap_xml_detected","sitemap_xml_final_url_live","sitemap_xml_target_url_redirects","sitemap_xml_final_url_status_code","sitemap_xml_final_url_mimetype","sitemap_xml_final_url_filesize_in_bytes","sitemap_xml_count","sitemap_xml_pdf_count","third_party_service_domains","third_party_service_count","login_provider","login_detected","dap_detected_final_url","dap_parameters_final_url"\r\n"18f.gov",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,"{""agency"":""GSA"",""subagency"":""TTS,18F""}"';

    expect(result).toEqual(expectedResult);
  });

  it('serializes an array containing more than one website with dap parameters', () => {
    const serializer = new CsvSerializer(Snapshot.CSV_COLUMN_ORDER);
    const firstWebsite = new Website();
    const firstCoreResult = new CoreResult();
    firstCoreResult.dapParameters = 'agency=GSA&subagency=TTS,18F';
    firstWebsite.url = '18f.gov';
    firstWebsite.coreResult = firstCoreResult;

    const secondWebsite = new Website();
    const secondCoreResult = new CoreResult();
    secondCoreResult.dapParameters = 'agency=AmeriCorps&cto=12';
    secondWebsite.url = 'mentor.gov';
    secondWebsite.coreResult = secondCoreResult;

    const result = serializer.serialize([firstWebsite, secondWebsite]);
    const expectedResult =
      '"target_url","target_url_domain","final_url","final_url_domain","final_url_website","canonical_link","final_url_mimetype","final_url_live","target_url_redirects","final_url_same_domain","final_url_same_website","target_url_agency_owner","target_url_bureau_owner","target_url_branch","final_url_status_code","target_url_404_test","scan_date","primary_scan_status","not_found_scan_status","robots_txt_scan_status","sitemap_xml_scan_status","dns_scan_status","dns_ipv6","hsts","dns_hostname","source_list","cms","cloud_dot_gov_pages","required_links_url","required_links_text","uswds_favicon","uswds_favicon_in_css","uswds_publicsans_font","uswds_count","uswds_usa_classes","uswds_inline_css","uswds_string","uswds_string_in_css","uswds_semantic_version","uswds_version","og_article_published_final_url","og_article_modified_final_url","og_title_final_url","og_description_final_url","main_element_present_final_url","robots_txt_final_url","robots_txt_detected","robots_txt_final_url_live","robots_txt_target_url_redirects","robots_txt_final_url_status_code","robots_txt_final_url_mimetype","robots_txt_final_url_filesize_in_bytes","robots_txt_crawl_delay","robots_txt_sitemap_locations","sitemap_xml_final_url","sitemap_xml_detected","sitemap_xml_final_url_live","sitemap_xml_target_url_redirects","sitemap_xml_final_url_status_code","sitemap_xml_final_url_mimetype","sitemap_xml_final_url_filesize_in_bytes","sitemap_xml_count","sitemap_xml_pdf_count","third_party_service_domains","third_party_service_count","login_provider","login_detected","dap_detected_final_url","dap_parameters_final_url"\r\n"18f.gov",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,"{""agency"":""GSA"",""subagency"":""TTS,18F""}"\r\n"mentor.gov",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,"{""agency"":""AmeriCorps"",""cto"":""12""}"';

    expect(result).toEqual(expectedResult);
  });

  it('serializes a csv file and removes newline characters in the process', () => {
    const serializer = new CsvSerializer(Snapshot.CSV_COLUMN_ORDER);
    const website = new Website();
    const coreResult = new CoreResult();
    coreResult.ogDescriptionFinalUrl = 'Yadda \nYadda \nYadda';
    website.url = '18f.gov';
    website.coreResult = coreResult;

    const result = serializer.serialize([website]);
    const expectedResult =
      '"target_url","target_url_domain","final_url","final_url_domain","final_url_website","canonical_link","final_url_mimetype","final_url_live","target_url_redirects","final_url_same_domain","final_url_same_website","target_url_agency_owner","target_url_bureau_owner","target_url_branch","final_url_status_code","target_url_404_test","scan_date","primary_scan_status","not_found_scan_status","robots_txt_scan_status","sitemap_xml_scan_status","dns_scan_status","dns_ipv6","hsts","dns_hostname","source_list","cms","cloud_dot_gov_pages","required_links_url","required_links_text","uswds_favicon","uswds_favicon_in_css","uswds_publicsans_font","uswds_count","uswds_usa_classes","uswds_inline_css","uswds_string","uswds_string_in_css","uswds_semantic_version","uswds_version","og_article_published_final_url","og_article_modified_final_url","og_title_final_url","og_description_final_url","main_element_present_final_url","robots_txt_final_url","robots_txt_detected","robots_txt_final_url_live","robots_txt_target_url_redirects","robots_txt_final_url_status_code","robots_txt_final_url_mimetype","robots_txt_final_url_filesize_in_bytes","robots_txt_crawl_delay","robots_txt_sitemap_locations","sitemap_xml_final_url","sitemap_xml_detected","sitemap_xml_final_url_live","sitemap_xml_target_url_redirects","sitemap_xml_final_url_status_code","sitemap_xml_final_url_mimetype","sitemap_xml_final_url_filesize_in_bytes","sitemap_xml_count","sitemap_xml_pdf_count","third_party_service_domains","third_party_service_count","login_provider","login_detected","dap_detected_final_url","dap_parameters_final_url"\r\n"18f.gov",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,"Yadda Yadda Yadda",,,,,,,,,,,,,,,,,,,,,,,,,';

    expect(result).toEqual(expectedResult);
  });
});
