import { parse } from '@fast-csv/parse';
import { Injectable, Logger } from '@nestjs/common';
import { UrlListDataFetcher } from './url-list-data-fetcher';
import { CreateWebsiteDto } from '@app/database/websites/dto/create-website.dto';
import { WebsiteService } from '@app/database/websites/websites.service';

import { SubdomainRow } from './subdomain-row.interface';

/**
 * Maps every SubdomainRow source-list field name to its canonical label string.
 *
 * This is the single edit point for source-list additions.  To add a new source:
 *   1. Add a field to SubdomainRow (subdomain-row.interface.ts)
 *   2. Add an entry here: sourceListFieldName → 'label'
 *
 * The headers[] array fed to fast-csv is derived automatically from the keys of
 * this map (preserving insertion order), so no second edit is needed there.
 *
 * [SOURCE-ADD-POINT]
 */
export const SOURCE_LISTS: Partial<Record<keyof SubdomainRow, string>> = {
  sourceListFederalDomains: 'gov',
  sourceListDap:            'dap',
  sourceListPulse:          'pulse',
  sourceListOmbIdea:        'omb_idea',
  sourceListEotw:           '2020_eot',
  sourceListUsagov:         'usagov',
  sourceListGovMan:         'gov_man',
  sourceListUscourts:       'uscourts',
  sourceListOira:           'oira',
  sourceListOther:          'other',
  sourceListMil1:           'mil-sites1',
  sourceListMil2:           'mil-sites2',
  sourceListDodPublic:      'dod_public',
  sourceListDotmil:         'dotmil',
  sourceListFinalUrlWebsites: 'final_url_websites',
  sourceListHouse117th:     'house_117th',
  sourceListSenate117th:    'senate_117th',
  sourceListGpoFdlp:        'gpo_fdlp',
  sourceListCisa:           'cisa',
  sourceListDod2025:        'dod_2025',
  sourceListDap2:           'dap2',
  sourceListUsagovClicks:       'usagov_clicks',
  sourceListUsagovClicksMil:    'usagov_clicks_mil',
  sourceListSearchGov:          'searchgov',
  sourceListSearchGovMil:       'searchgov_mil',
  sourceListPublicInventory:    'public_inventory',
  sourceListNonGovMil:          'non_govmil',
  sourceListGovtUrls:           'govt_urls',
  sourceListHyperlinkDomains:   'hyperlink_domains',
} as const;

/** The source-list field names in their canonical CSV column order. */
const SOURCE_LIST_FIELDS = Object.keys(SOURCE_LISTS) as Array<
  keyof typeof SOURCE_LISTS
>;

@Injectable()
export class IngestService {
  private logger = new Logger(IngestService.name);

  constructor(
    private websiteService: WebsiteService,
    private urlListDataFetcher: UrlListDataFetcher,
  ) {}

  async getUrls(url?: string): Promise<string> {
    return await this.urlListDataFetcher.fetch(url);
  }

  /**
   * writeUrls writes target urls to the Websites table.
   */
  async writeUrls(urls, maxRows?: number) {
    const writes: Promise<any>[] = [];
    const newestWebsiteRecord = await this.websiteService.findNewestWebsite();
    let hasParsingError = false;

    const stream = parse<SubdomainRow, CreateWebsiteDto>({
      headers: [
        'targetUrl',
        'baseDomain',
        'topLevelDomain',
        'branch',
        'agency',
        'bureau',
        // Source-list fields are derived from SOURCE_LISTS key order so that
        // adding a new entry to SOURCE_LISTS is the only required edit.
        ...SOURCE_LIST_FIELDS,
        'filtered',
        'pageviews',
        'visits',
      ],
      renameHeaders: true, // discard the existing headers to ease parsing
      maxRows: maxRows,
    })
      .transform((data: SubdomainRow): CreateWebsiteDto => {
        let filtered = null;
        let pageviews = null;
        let visits = null;
        if (data.pageviews) {
          pageviews = data.pageviews;
        }
        if (data.visits) {
          visits = data.visits;
        }

        if (data.filtered.toLowerCase() === 'true') {
          filtered = true;
        } else if (data.filtered.toLowerCase() === 'false') {
          filtered = false;
        }

        return {
          ...data,
          website: data.targetUrl.toLowerCase(),
          sourceList: this.getSourceList(data),
          filter: filtered,
          pageviews,
          visits,
        };
      })
      .on('error', (error) => {
        hasParsingError = true;
        this.logger.error(error.message, error.stack);
      })
      .on('data', (row: CreateWebsiteDto) => {
        writes.push(this.writeToDatabase(row));
      })
      .on('end', (rowCount: number) => {
        this.logger.debug(rowCount);
      });

    stream.write(urls);

    const end = new Promise<void>((resolve, reject) => {
      stream.end(async () => {
        if (hasParsingError) {
          // Parsing failed — no rows were safely transformed; resolve without
          // attempting DB writes so the caller doesn't hang.
          resolve();
          return;
        }

        try {
          await Promise.all(writes);
          const allWebsites = await this.websiteService.findAllWebsites();
          this.logger.log(
            `total number of websites following ingest: ${allWebsites.length}`,
          );

          if (newestWebsiteRecord) {
            this.logger.log(`invalid url(s) detected`);
            const deleted = await this.websiteService.deleteBefore(
              new Date(newestWebsiteRecord.updated),
            );
            this.logger.log(
              `finished removing ${deleted.affected} invalid url(s)`,
            );

            const allWebsitesFollowingDeletion =
              await this.websiteService.findAllWebsites();
            this.logger.log(
              `total number of websites following delection of invalid url(s): ${allWebsitesFollowingDeletion.length}`,
            );
          }

          resolve();
        } catch (error) {
          const err = error as Error;
          this.logger.error(
            `encountered error during ingest process: ${err.message}`,
            err.stack,
          );
          reject(err);
        }
      });
    });

    return end;
  }

  /**
   * writeToDatabase writes a CSV row to the database.
   * @param row a CreateWebsiteDto object.
   */
  async writeToDatabase(row: CreateWebsiteDto) {
    try {
      await this.websiteService.upsert(row);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `encountered error saving to database: ${err.message}`,
        err.stack,
      );
    }
  }

  private getSourceList(row: SubdomainRow): string {
    return SOURCE_LIST_FIELDS.filter(
      (field) => String(row[field] ?? '').toLowerCase() === 'true',
    )
      .map((field) => SOURCE_LISTS[field])
      .join(',');
  }
}
