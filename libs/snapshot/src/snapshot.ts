import { StorageService } from '@app/storage';
import { Website } from 'entities/website.entity';
import { Serializer } from './serializers/serializer';

export class Snapshot {
  storageService: StorageService;
  serializers: Serializer[];
  websites: Website[];
  priorDate: string;
  fileName: string;

  static CSV_COLUMN_ORDER = [
    'target_url',
    'target_url_domain',
    'final_url',
    'final_url_domain',
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
    'source_list_federal_domains',
    'source_list_dap',
    'source_list_pulse',
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
    'login_detected',
    'dap_detected_final_url',
    'dap_parameters_final_url',
  ];

  constructor(
    storageService: StorageService,
    serializers: Serializer[],
    websites: Website[],
    priorDate: string,
    fileName: string,
  ) {
    this.storageService = storageService;
    this.serializers = serializers;
    this.websites = websites;
    this.priorDate = priorDate;
    this.fileName = fileName;
  }

  async archivePriorSnapshot(): Promise<void> {
    const operations = [];

    this.serializers.forEach((serializer) => {
      const newFileName = `archive/${serializer.fileExtension}/${this.fileName}-${this.priorDate}.${serializer.fileExtension}`;
      operations.push(
        this.storageService.copy(
          `${this.fileName}.${serializer.fileExtension}`,
          newFileName,
        ),
      );
    });

    await Promise.all(operations);
  }

  async saveNewSnapshot(): Promise<void> {
    const operations = [];

    this.serializers.forEach((serializer) => {
      operations.push(
        this.storageService.upload(
          `${this.fileName}.${serializer.fileExtension}`,
          serializer.serialize(this.websites),
        ),
      );
    });

    await Promise.all(operations);
  }
}
