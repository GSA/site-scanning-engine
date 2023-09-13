import { parse } from '@fast-csv/parse';
import { Injectable, Logger } from '@nestjs/common';
import { UrlList } from './url-list';
import { CreateWebsiteDto } from '@app/database/websites/dto/create-website.dto';
import { WebsiteService } from '@app/database/websites/websites.service';

import { SubdomainRow } from './subdomain-row.interface';

@Injectable()
export class IngestService {
  private logger = new Logger(IngestService.name);

  constructor(
    private websiteService: WebsiteService,
    private urlList: UrlList,
  ) {}

  async getUrls(url?: string): Promise<string> {
    return await this.urlList.fetch(url);
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
        'sourceListOther',
      ],
      renameHeaders: true, // discard the existing headers to ease parsing
      maxRows: maxRows,
    })
      .transform(
        (data: SubdomainRow): CreateWebsiteDto => ({
          ...data,
          website: data.targetUrl.toLowerCase(),
          agencyCode: data.agencyCode ? parseInt(data.agencyCode) : null,
          bureauCode: data.bureauCode ? parseInt(data.bureauCode) : null,
          sourceList: this.getSourceList(data),
        }),
      )
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
            this.logger.debug('finished ingest of urls');

            if (newestWebsiteRecord) {
              this.logger.log(`invalid url(s) detected`);
              const deleted = await this.websiteService.deleteBefore(
                new Date(newestWebsiteRecord.updated),
              );
              this.logger.log(
                `finished removing ${deleted.affected} invalid url(s)`,
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

    if (row.sourceListOther.toLowerCase() === 'true') {
      sourceList.push('other');
    }

    return sourceList.join(',');
  }
}
