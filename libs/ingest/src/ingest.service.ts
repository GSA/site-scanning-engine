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
        'agencyCode',
        'bureau',
        'bureauCode',
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
        'ombIdeaPublic',
        'sourceListMil',
      ],
      renameHeaders: true, // discard the existing headers to ease parsing
      maxRows: maxRows,
    })
      .transform((data: SubdomainRow): CreateWebsiteDto => {
        let ombIdeaPublic = null;

        if (data.ombIdeaPublic.toLowerCase() === 'true') {
          ombIdeaPublic = true;
        } else if (data.ombIdeaPublic.toLowerCase() === 'false') {
          ombIdeaPublic = false;
        }

        return {
          ...data,
          website: data.targetUrl.toLowerCase(),
          agencyCode: data.agencyCode ? parseInt(data.agencyCode) : null,
          bureauCode: data.bureauCode ? parseInt(data.bureauCode) : null,
          sourceList: this.getSourceList(data),
          ombIdeaPublic,
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
      sourceList.push('eotw');
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

    if (row.sourceListMil.toLowerCase() === 'true') {
      sourceList.push('mil');
    }

    return sourceList.join(',');
  }
}
