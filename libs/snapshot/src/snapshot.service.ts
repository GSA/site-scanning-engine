import { Injectable, Logger } from '@nestjs/common';

import { WebsiteService } from '@app/database/websites/websites.service';
import { StorageService } from '@app/storage';

import { Website } from 'entities/website.entity';
import { DatetimeService } from 'libs/datetime/src';
import * as csv from './csv';
import { CoreResult } from 'entities/core-result.entity';

@Injectable()
export class SnapshotService {
  private logger = new Logger(SnapshotService.name);

  constructor(
    private storageService: StorageService,
    private websiteService: WebsiteService,
    private datetimeService: DatetimeService,
  ) {}

  /**
   * weeklySnapshot is meant to be called weekly (likely through a CRON job).
   *
   * If there is an existing weekly-snapshot.json and weekly-snapshot.csv it copies it to the
   * archive bucket, and names it weekly-snapshot-<date-one-week-previous>.
   */
  async weeklySnapshot() {
    const date = this.datetimeService.now();
    date.setDate(date.getDate() - 7);

    const newJsonName = `archive/json/weekly-snapshot-${date.toISOString()}.json`;
    const newCsvName = `archive/csv/weekly-snapshot-${date.toISOString()}.csv`;

    this.logger.debug('archiving any exisiting files...');
    await Promise.all([
      await this.archive('weekly-snapshot.json', newJsonName),
      await this.archive('weekly-snapshot.csv', newCsvName),
    ]);

    const results = await this.getResults();
    const jsonData = this.serializeToJson(results);
    const csvData = this.serializeToCsv(results);

    this.logger.debug('saving any new files...');
    await Promise.all([
      this.save('weekly-snapshot.json', jsonData),
      this.save('weekly-snapshot.csv', csvData),
    ]);
  }

  private async getResults(): Promise<Website[]> {
    this.logger.debug('finding all results...');
    const results = await this.websiteService.findWebsiteResults();
    return results;
  }

  private serializeToJson(results: Website[]): string {
    const serializedResults = results.map((website) => {
      return website.serialized();
    });
    const stringified = JSON.stringify(serializedResults);
    return stringified;
  }

  private serializeToCsv(results: Website[]) {
    // Throw an exception if there's a mismatch between CSV_COLUMN_ORDER and the CoreResult entity.
    csv.ensureAllFields(
      new Set([...CoreResult.getColumnNames(), ...Website.getColumnNames()]),
      new Set(CSV_COLUMN_ORDER),
    );
    
    const serializedResults = results.map((website) => {
      return website.serialized();
    });
    console.log(serializedResults)
    return csv.createCsv(serializedResults, CSV_COLUMN_ORDER);
  }

  private async save(fileName: string, data: string) {
    await this.storageService.upload(fileName, data);
  }

  private async archive(fileName: string, newName: string) {
    await this.storageService.copy(fileName, newName);
  }
}

/*
  Column order for snapshot CSV.
  NOTE: If new columns are added to the database, they *must* also be added
  here. This requirement exists to guarantee that CSV column order is
  never implicitly determined, as there are users who depend on the CSV order
  never changing.
*/
const CSV_COLUMN_ORDER = [
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
  'target_url_agency_code',
  'target_url_bureau_code',
  'scan_date',
  'home_scan_status',
  'not_found_scan_status',
  'robots_txt_scan_status',
  'sitemap_xml_scan_status',
  'dns_scan_status',
  'uswds_favicon',
  'uswds_favicon_in_css',
  'uswds_merriweather_font',
  'uswds_publicsans_font',
  'uswds_source_sans_font',
  'uswds_tables',
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
  'dns_ipv6',
  'third_party_service_domains',
  'third_party_service_count',
  'dap_detected_final_url',
  'dap_parameters_final_url',
];
