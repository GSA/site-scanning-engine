import { parse } from '@fast-csv/parse';
import { Injectable, Logger } from '@nestjs/common';
import { UrlListDataFetcher } from './url-list-data-fetcher';
import { CreateWebsiteDto } from '@app/database/websites/dto/create-website.dto';
import { WebsiteService } from '@app/database/websites/websites.service';

import { SubdomainRow } from './subdomain-row.interface';

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
        'sourceListFederalDomains',
        'sourceListDap',
        'sourceListPulse',
        'sourceListOmbIdea',
        'sourceListEotw',
        'sourceListUsagov',
        'sourceListGovMan',
        'sourceListUscourts',
        'sourceListOira',
        'sourceListOther',
        'sourceListMil1',
        'sourceListMil2',
        'sourceListDodPublic',
        'sourceListDotmil',
        'sourceListFinalUrlWebsites',
        'sourceListHouse117th',
        'sourceListSenate117th',
        'sourceListGpoFdlp',
        'sourceListCisa',
        'sourceListDod2025',
        'sourceListDap2',
        'sourceListUsagovClicks',
        'sourceListUsagovClicksMil',
        'sourceListSearchGov',
        'sourceListSearchGovMil',
        'sourceListPublicInventory',
        // [SOURCE-ADD-POINT]
        // Add new source list here
        // e.g.
        // 'sourceListNewList',
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

    const end = new Promise((resolve) => {
      stream.end(async () => {
        if (!hasParsingError) {
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

            resolve('');
          } catch (error) {
            const err = error as Error;
            this.logger.error(
              `encountered error during ingest process: ${err.message}`,
              err.stack,
            );
          }
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
    const sourceList = [];

    if (row.sourceListFederalDomains.toLowerCase() === 'true') {
      sourceList.push('gov');
    }

    if (row.sourceListDap.toLowerCase() === 'true') {
      sourceList.push('dap');
    }

    if (row.sourceListPulse.toLowerCase() === 'true') {
      sourceList.push('pulse');
    }

    if (row.sourceListOmbIdea.toLowerCase() === 'true') {
      sourceList.push('omb_idea');
    }

    if (row.sourceListEotw.toLowerCase() === 'true') {
      sourceList.push('2020_eot');
    }

    if (row.sourceListUsagov.toLowerCase() === 'true') {
      sourceList.push('usagov');
    }

    if (row.sourceListGovMan.toLowerCase() === 'true') {
      sourceList.push('gov_man');
    }

    if (row.sourceListUscourts.toLowerCase() === 'true') {
      sourceList.push('uscourts');
    }

    if (row.sourceListOira.toLowerCase() === 'true') {
      sourceList.push('oira');
    }

    if (row.sourceListOther.toLowerCase() === 'true') {
      sourceList.push('other');
    }

    if (row.sourceListMil1.toLowerCase() === 'true') {
      sourceList.push('mil-sites1');
    }

    if (row.sourceListMil2.toLowerCase() === 'true') {
      sourceList.push('mil-sites2');
    }

    if (row.sourceListDodPublic.toLowerCase() === 'true') {
      sourceList.push('dod_public');
    }

    if (row.sourceListDotmil.toLowerCase() === 'true') {
      sourceList.push('dotmil');
    }

    if (row.sourceListFinalUrlWebsites.toLowerCase() === 'true') {
      sourceList.push('final_url_websites');
    }

    if (row.sourceListHouse117th.toLowerCase() === 'true') {
      sourceList.push('house_117th');
    }

    if (row.sourceListSenate117th.toLowerCase() === 'true') {
      sourceList.push('senate_117th');
    }

    if (row.sourceListGpoFdlp.toLowerCase() === 'true') {
      sourceList.push('gpo_fdlp');
    }

    if (row.sourceListCisa.toLowerCase() === 'true') {
      sourceList.push('cisa');
    }

    if (row.sourceListDod2025.toLowerCase() === 'true') {
      sourceList.push('dod_2025');
    }

    if (row.sourceListPublicInventory.toLowerCase() === 'true') {
      sourceList.push('public_inventory');
    }

    // [SOURCE-ADD-POINT]
    // Add new source list here
    // e.g.
    // if (row.sourceListNewSource.toLowerCase() === 'true') {
    //   sourceList.push('new_source');
    // }

    return sourceList.join(',');
  }
}
