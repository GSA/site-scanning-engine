import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { CsvSerializer } from './csv-serializer';
import { Snapshot } from '../snapshot';

describe('CsvSerializer', () => {
  it('returns headers when no data is passed', () => {
    const serializer = new CsvSerializer(Snapshot.CSV_COLUMN_ORDER);
    const website = new Website();
    const coreResult = new CoreResult();
    website.coreResult = coreResult;

    const result = serializer.serialize([]);

    expect(result).toEqual(
      '"target_url","target_url_domain","final_url","final_url_domain","final_url_mimetype","final_url_live","target_url_redirects","final_url_same_domain","final_url_same_website","target_url_agency_owner","target_url_bureau_owner","target_url_branch","final_url_status_code","target_url_404_test","scan_date","primary_scan_status","not_found_scan_status","robots_txt_scan_status","sitemap_xml_scan_status","dns_scan_status","dns_ipv6","source_list_federal_domains","source_list_dap","source_list_pulse","uswds_favicon","uswds_favicon_in_css","uswds_publicsans_font","uswds_count","uswds_usa_classes","uswds_inline_css","uswds_string","uswds_string_in_css","uswds_semantic_version","uswds_version","og_article_published_final_url","og_article_modified_final_url","og_title_final_url","og_description_final_url","main_element_present_final_url","robots_txt_final_url","robots_txt_detected","robots_txt_final_url_live","robots_txt_target_url_redirects","robots_txt_final_url_status_code","robots_txt_final_url_mimetype","robots_txt_final_url_filesize_in_bytes","robots_txt_crawl_delay","robots_txt_sitemap_locations","sitemap_xml_final_url","sitemap_xml_detected","sitemap_xml_final_url_live","sitemap_xml_target_url_redirects","sitemap_xml_final_url_status_code","sitemap_xml_final_url_mimetype","sitemap_xml_final_url_filesize_in_bytes","sitemap_xml_count","sitemap_xml_pdf_count","third_party_service_domains","third_party_service_count","login_detected","dap_detected_final_url","dap_parameters_final_url"',
    );
  });

  it('serializes an array containing one website', () => {
    const serializer = new CsvSerializer(Snapshot.CSV_COLUMN_ORDER);
    const website = new Website();
    const coreResult = new CoreResult();
    website.url = '18f.gov';
    website.coreResult = coreResult;

    const result = serializer.serialize([website]);

    expect(result).toEqual(
      '"target_url","target_url_domain","final_url","final_url_domain","final_url_mimetype","final_url_live","target_url_redirects","final_url_same_domain","final_url_same_website","target_url_agency_owner","target_url_bureau_owner","target_url_branch","final_url_status_code","target_url_404_test","scan_date","primary_scan_status","not_found_scan_status","robots_txt_scan_status","sitemap_xml_scan_status","dns_scan_status","dns_ipv6","source_list_federal_domains","source_list_dap","source_list_pulse","uswds_favicon","uswds_favicon_in_css","uswds_publicsans_font","uswds_count","uswds_usa_classes","uswds_inline_css","uswds_string","uswds_string_in_css","uswds_semantic_version","uswds_version","og_article_published_final_url","og_article_modified_final_url","og_title_final_url","og_description_final_url","main_element_present_final_url","robots_txt_final_url","robots_txt_detected","robots_txt_final_url_live","robots_txt_target_url_redirects","robots_txt_final_url_status_code","robots_txt_final_url_mimetype","robots_txt_final_url_filesize_in_bytes","robots_txt_crawl_delay","robots_txt_sitemap_locations","sitemap_xml_final_url","sitemap_xml_detected","sitemap_xml_final_url_live","sitemap_xml_target_url_redirects","sitemap_xml_final_url_status_code","sitemap_xml_final_url_mimetype","sitemap_xml_final_url_filesize_in_bytes","sitemap_xml_count","sitemap_xml_pdf_count","third_party_service_domains","third_party_service_count","login_detected","dap_detected_final_url","dap_parameters_final_url"\n"18f.gov",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    );
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

    expect(result).toEqual(
      '"target_url","target_url_domain","final_url","final_url_domain","final_url_mimetype","final_url_live","target_url_redirects","final_url_same_domain","final_url_same_website","target_url_agency_owner","target_url_bureau_owner","target_url_branch","final_url_status_code","target_url_404_test","scan_date","primary_scan_status","not_found_scan_status","robots_txt_scan_status","sitemap_xml_scan_status","dns_scan_status","dns_ipv6","source_list_federal_domains","source_list_dap","source_list_pulse","uswds_favicon","uswds_favicon_in_css","uswds_publicsans_font","uswds_count","uswds_usa_classes","uswds_inline_css","uswds_string","uswds_string_in_css","uswds_semantic_version","uswds_version","og_article_published_final_url","og_article_modified_final_url","og_title_final_url","og_description_final_url","main_element_present_final_url","robots_txt_final_url","robots_txt_detected","robots_txt_final_url_live","robots_txt_target_url_redirects","robots_txt_final_url_status_code","robots_txt_final_url_mimetype","robots_txt_final_url_filesize_in_bytes","robots_txt_crawl_delay","robots_txt_sitemap_locations","sitemap_xml_final_url","sitemap_xml_detected","sitemap_xml_final_url_live","sitemap_xml_target_url_redirects","sitemap_xml_final_url_status_code","sitemap_xml_final_url_mimetype","sitemap_xml_final_url_filesize_in_bytes","sitemap_xml_count","sitemap_xml_pdf_count","third_party_service_domains","third_party_service_count","login_detected","dap_detected_final_url","dap_parameters_final_url"\n"18f.gov",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n"nasa.gov",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    );
  });

  it('produces a valid CSV', () => {
    const serializer = new CsvSerializer(['field1', 'field2', 'field3']);
    const csvString = serializer.createCsv(MOCK_DATA);
    expect(csvString).toEqual(
      `"field1","field2","field3"\n"1a","2a","3a"\n"1b","2b","3b"`,
    );
  });

  it('produces a valid CSV with dot-delimimited header fields', () => {
    const serializer = new CsvSerializer([
      'field1',
      'field2',
      'field3',
      'field4',
    ]);
    const csvString = serializer.createCsv(MOCK_NESTED_DATA);
    expect(csvString).toEqual(
      `"field1","field2","field2.subfield1","field2.subfield2.subsubfielda","field2.subfield2.subsubfieldb","field2.subfield3","field3","field4"\n"1a",,"2a1","2a2a","2a2b","2a3","3a","[""4a"",""4b""]"\n"1b","2b",,,,,"3b",`,
    );
  });

  it('handles an empty list', () => {
    const serializer = new CsvSerializer(['field1', 'field2', 'field3']);
    const csvString = serializer.createCsv([]);
    expect(csvString).toEqual(`"field1","field2","field3"`);
  });
});

const MOCK_DATA = [
  { field1: '1a', field2: '2a', field3: '3a' },
  { field1: '1b', field2: '2b', field3: '3b' },
];

const MOCK_NESTED_DATA = [
  {
    field1: '1a',
    field2: {
      subfield1: '2a1',
      subfield2: {
        subsubfielda: '2a2a',
        subsubfieldb: '2a2b',
      },
      subfield3: '2a3',
    },
    field3: '3a',
    field4: ['4a', '4b'],
  },
  { field1: '1b', field2: '2b', field3: '3b' },
];
