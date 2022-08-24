import { ScanStatus } from 'entities/scan-status';

export class WebsiteApiResultDto {
  /**
   * `scan_date` is a datetime string that records when the scan was performed.
   *
   * @example 2020-12-30T00:00:03.821Z
   */
  scan_date: string;

  /**
   * `target_url_domain` is the base domain (domain name + top-level domain) of the target url.
   *
   * @example 18f.gov
   */
  target_url_domain: string;

  /**
   * `scan_status` is the success status of the Core Scan.
   *
   * @example completed
   */
  scan_status: ScanStatus;

  /**
   * `final_url` is the url after any redirects from the target url.
   *
   * @example https://18f.gsa.gov/
   */
  final_url: string;

  /**
   * `final_url_live` is a boolean representing whether the final url returned a
   * 2xx family HTTP status code.
   *
   * @example true
   */
  final_url_live: boolean;

  /**
   * `final_url_domain` is the domain name + top-level domain of the final url.
   *
   * @example gsa.gov
   */
  final_url_domain: string;

  /**
   * `final_url_MIMEType` is the MIME type of the final url extracted from the Content-Type header.
   *
   * @example text/html
   */
  final_url_MIMEType: string;

  /**
   * `final_url_same_domain` is a boolean field representing whether the final url is in the
   * same domain as the target url. If false, this implies a redirect.
   *
   * @example false
   */
  final_url_same_domain: string;

  /**
   * `final_url_status_code` is the HTTP status code of the final url.
   *
   * @example 200
   */
  final_url_status_code: number;

  /**
   * `final_url_same_website` is a boolean that indicates if the final url has a different path or domain
   * from the target url.
   *
   * @example false
   */
  final_url_same_website: boolean;

  /**
   * `target_url_404_test` tests whether the target URL properly handles 404s by called a UUID-based pathname,
   *
   * @example true
   */
  target_url_404_test: boolean;

  /**
   * `target_url_redirects` is a boolean that indicates whether the target url redirects.
   *
   * @example true
   */
  target_url_redirects: boolean;

  /**
   * `solutions_scan_status` is a enumeration that shows the success status of the Solutions Scan.
   *
   * @example completed
   */
  solutions_scan_status: string;

  /**
   * `uswds_usa_classes` is the number of CSS classes found that start with ".usa-".
   *
   * @example 50
   */
  uswds_usa_classes: number;

  /**
   * `uswds_string` is the number of times the string "uswds" occurs in the HTML source.
   *
   * @example 1
   */
  uswds_string: number;

  /**
   * `uswds_tables` is a calculation of the (number of html `<table>` elements) * -10. <table> elements
   * are a negative heuristic indicator of the presence of USWDS.
   *
   * @example 0
   */
  uswds_tables: number;

  /**
   * `uswds_inline_css` is the number of occurrences of ".usa-" CSS classes in inline html source.
   *
   * @example 0
   */
  uswds_inline_css: number;

  /**
   * `uswds_favicon` is the presence of the USWDS US Flag favicon in HTML source. Presence adds 20 points to
   * the USWDS likelihood heuristic.
   *
   * @example 20
   */
  uswds_favicon: number;

  /**
   * `uswds_string_in_css` is the number of occurences of "uswds" in the CSS source.
   *
   * @example 20
   */
  uswds_string_in_css: number;

  /**
   * `uswds_favicon_in_css` is the presence of the USWDS US Flag favicon in CSS source. Presence adds 20 points to
   * the uswds likelihood heuristic.
   *
   * @example 0
   */
  uswds_favicon_in_css: number;

  /**
   * `uswds_publicsans_font` is the presence of the Public Sans font in CSS source.
   * Presence adds 20 points to the USWDS likelihood heuristic.
   *
   * @example 20
   */
  uswds_publicsans_font: number;

  /**
   * `uswds_source_sans_font` is the presence of the Source Sans font in CSS soure.
   * Presence adds 5 points to the USWDS likelihood heuristic.
   */
  uswds_source_sans_font: number;

  /**
   * `uswds_semantic_version` is the semantic version string of USWDS.
   *
   * @example "2.9.0"
   */
  uswds_semantic_version: string;

  /**
   * `uswds_version` is the presence of the USWDS version in CSS source.
   * Presence adds 20 points to the USWDS likelihood heuristic.
   *
   * @example 20
   */
  uswds_version: number;

  /**
   * `uswds_count` is the total of all USWDS likelihood heuristics in a sum.
   *
   * @example 141
   */
  uswds_count: number;

  /**
   * `dap_detected_final_url` is a boolean representing the presence of the Digital Analytics Program
   * on the final url.
   *
   * @example true
   */
  dap_detected_final_url: boolean;

  /**
   * `dap_parameters_final_url` is the an object with Digital Analytics Program parameter keys and values.
   */
  dap_parameters_final_url: any;

  /**
   * `og_title_final_url` is the Open Graph title tag if found on the final url.
   *
   * @example "18F: Digital service delivery | Home"
   */
  og_title_final_url: string;

  /**
   * `og_description_final_url` is the Open Graph description tag if found on the final url.
   *
   * @example "18F builds effective, user-centric digital services focused on the interaction between government and the people and businesses it serves."
   */
  og_description_final_url: string;

  /**
   * `og_article_published_final_url` is the Open Graph article published tag.
   *
   * @example
   */
  og_article_published_final_url: string;

  /**
   * `og_article_modified_final_url` is the Open Graph article modified tag.
   *
   * @example
   */
  og_article_modified_final_url: string;

  /**
   * `main_element_present_final_url` is a boolean indicating whether the <main> element is present at the final url.
   *
   * @example true
   */
  main_element_present_final_url: boolean;

  /**
   * `robots_txt_final_url` is the final url of the robots.txt after any redirects.
   *
   * @example "https://18f.gsa.gov/robots.txt"
   */
  robots_txt_final_url: string;

  /**
   * `robots_txt_final_url_status_code` is the HTTP status code of the robots.txt final url.
   *
   * @example 200
   */
  robots_txt_final_url_status_code: number;

  /**
   * `robots_txt_final_url_live` is a boolean indicating whether the robots.txt final url HTTP is in the 2xx family.
   *
   * @example true
   */
  robots_txt_final_url_live: boolean;

  /**
   * `robots_txt_detected` is boolean represent whether the robots.txt file is detected.
   *
   * @example true
   */
  robots_txt_detected: boolean;

  /**
   * `robots_txt_final_url_MIMETYPE` is the MIME type of the robots.txt page extracted from Content-Type header.
   *
   * @example text/plain
   */
  robots_txt_final_url_MIMETYPE: string;

  /**
   * `robots_txt_target_url_redirects` is boolean indicating whether the target robots.txt field redirects.
   * Note that the target robots.txt is the target url with robots.txt as the pathname.
   *
   * @example true
   */
  robots_txt_target_url_redirects: boolean;

  /**
   * `robots_txt_final_url_size_in_bytes` is file size of the robots.txt file in bytes.
   *
   * @example 65
   */
  robots_txt_final_url_size_in_bytes: number;

  /**
   * `robots_txt_crawl_delay` is the crawl delay value in seconds, if present.
   *
   * @example 3
   */
  robots_txt_crawl_delay: number;

  /**
   * `sitemap_xml_detected` is a boolean indicating whether the sitemap.xml file is found.
   *
   * @example true
   */
  sitemap_xml_detected: boolean;

  /**
   * `sitemap_xml_final_url_status_code` is the HTTP status code of the sitemap.xml page.
   *
   * @example 200
   */
  sitemap_xml_final_url_status_code: number;

  /**
   * `sitemap_xml_final_url` is the final url of the sitemap.xml page after any redirects.
   *
   * @example "https://18f.gsa.gov/sitemap.xml"
   */
  sitemap_xml_final_url: string;

  /**
   * `sitemap_xml_final_url_live` is a boolean indicating whether the sitemap.xml final url status code
   * is in the 2xx family.
   *
   * @example true
   */
  sitemap_xml_final_url_live: boolean;

  /**
   * `sitemap_xml_target_url_redirects` is a boolean indicating whether the sitemap.xml page redirects. Note that
   * the target url is {targetUrl}/sitemap.xml.
   *
   * @example true
   */
  sitemap_xml_target_url_redirects: boolean;

  /**
   * `sitemap_xml_final_url_filesize` is a number indicating the filesize of the sitemap.xml page in bytes.
   *
   * @example 95598
   */
  sitemap_xml_final_url_filesize: number;

  /**
   * `sitemap_xml_final_url_MIMETYPE` is the MIME type of the sitemap.xml final url extracted from the Content-Type header.
   *
   * @example application/xml
   */
  sitemap_xml_final_url_MIMETYPE: string;

  /**
   * `sitemap_xml_count` indicates the number of `<url>` elements found in the sitemap.xml file.
   *
   * @example 600
   */
  sitemap_xml_count: number;

  /**
   * `sitemap_xml_pdf_count` is the number of urls that have the PDF extension.
   *
   * @example 0
   */
  sitemap_xml_pdf_count: number;

  /**
   * `third_party_service_domains` is a list of third party services that make outbound calls from the final url. Third party
   * is defined as not matching the hostname of the URL.
   *
   * @example ["dap.digitalgov.gov", "fonts.googleapis.com", "www.google-analytics.com"]
   */
  third_party_service_domains: string[];

  /**
   * `third_party_service_count` is the number of third party services found.
   *
   * @example 3
   */
  third_party_service_count: number;

  /**
   * `target_url` is the url the scanner starts the scan with.
   *
   * @example 18f.gov
   */
  target_url: string;

  /**
   * `target_url_branch` is the branch of government that the URL is associated with.
   *
   * @example Executive
   */
  target_url_branch: string;

  /**
   * `target_url_agency_owner` is the agency that owns the target url.
   *
   * @example "General Services Administration"
   */
  target_url_agency_owner: string;

  /**
   * `target_url_bureau_owner` is the name of the bureau that owns the target url.
   *
   * @example "GSA,FAS,Technology Transformation Service"
   */
  target_url_bureau_owner: string;

  /**
   * `source_list_federal_domains` indicates whether the List of Federal Domains provided this URL for the Target URL List.
   *
   * @example true
   */
  source_list_federal_domains: boolean;

  /**
   * `source_list_dap` indicates whether the Digital Analytics Program provided this URL for the Target URL List.
   *
   * @example true
   */
  source_list_dap: boolean;

  /**
   * `source_list_pulse` indicates whether the pulse.cio.gov Snapshot provided this URL for the Target URL List.
   *
   * @example true
   */
  source_list_pulse: boolean;
}
