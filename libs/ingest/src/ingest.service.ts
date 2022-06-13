import { parse } from '@fast-csv/parse';
import { HttpService, Injectable, Logger } from '@nestjs/common';
import { map } from 'rxjs/operators';

import { CreateWebsiteDto } from '@app/database/websites/dto/create-website.dto';
import { WebsiteService } from '@app/database/websites/websites.service';

import { SubdomainRow } from './subdomain-row.interface';
import { Website } from 'entities/website.entity';

@Injectable()
export class IngestService {
  private logger = new Logger(IngestService.name);

  constructor(
    private httpService: HttpService,
    private websiteService: WebsiteService,
  ) {}

  private currentFederalSubdomains =
    'https://raw.githubusercontent.com/GSA/federal-website-index/main/data/site-scanning-target-url-list.csv';

  async getUrls(): Promise<string> {
    const urls = await this.httpService
      .get(this.currentFederalSubdomains)
      .pipe(map((resp) => resp.data))
      .toPromise();
    return urls;
  }

  /**
   * writeUrls writes target urls to the Websites table.
   */
  async writeUrls(urls: string, maxRows?: number) {
    const writes: Promise<any>[] = [];
    const stream = parse<SubdomainRow, CreateWebsiteDto>({
      headers: [
        'website',
        'baseDomain',
        'url',
        'branch',
        'agency',
        'agencyCode',
        'bureau',
        'bureauCode',
        'sourceListFederalDomains',
        'sourceListDap',
        'sourceListPulse',
      ],
      renameHeaders: true, // discard the existing headers to ease parsing
      maxRows: maxRows,
    })
      .transform(
        (data: SubdomainRow): CreateWebsiteDto => ({
          ...data,
          website: data.website.toLowerCase(),
          agencyCode: data.agencyCode ? parseInt(data.agencyCode) : null,
          bureauCode: data.bureauCode ? parseInt(data.bureauCode) : null,
          sourceListFedDomains: data.sourceListFedDomains
            ? data.sourceListFedDomains
            : null,
          sourceListDap: data.sourceListDap ? data.sourceListDap : null,
          sourceListPulse: data.sourceListPulse ? data.sourceListPulse : null,
        }),
      )
      .on('error', (error) => this.logger.error(error.message, error.stack))
      .on('data', (row: CreateWebsiteDto) => {
        writes.push(this.writeToDatabase(row));
      })
      .on('end', (rowCount: number) => {
        this.logger.debug(rowCount);
      });

    stream.write(urls);
    const end = new Promise((resolve) => {
      stream.end(async () => {
        await Promise.all(writes);
        this.logger.debug('finished ingest of urls');
        resolve('');
      });
    });

    return end;
  }

  /**
   * removeOldUrls checks urls in the website table against the most recently
   * ingested url list, finds urls that are no longer on the url list, and
   * removes those urls from the websites and core-scan tables.
   */
  async removeOldUrls(urls: string) {
    // list of valid target URLs
    const validUrls = [];

    const stream = parse({
      headers: [
        'website',
        'baseDomain',
        'url',
        'branch',
        'agency',
        'agencyCode',
        'bureau',
        'bureauCode',
        'sourceListFederalDomains',
        'sourceListDap',
        'sourceListPulse',
      ],
      renameHeaders: true,
    })
      .transform((data: SubdomainRow) => ({
        website: data.website.toLowerCase(),
      }))
      .on('error', (error) => this.logger.error(error.message, error.stack))
      .on('data', (row) => {
        validUrls.push(row['website']);
      });

    stream.write(urls);

    const end = new Promise((resolve) => {
      stream.end(async () => {
        try {
          const savedWebsites = await this.websiteService.findAllWebsites();

          const idsToDelete = this.getInvalidWebsiteIds(
            savedWebsites,
            validUrls,
          );

          if (idsToDelete.length > 0) {
            this.logger.debug(
              `number of websites flagged for removal from the database: ${idsToDelete.length}`,
            );

            await Promise.all(
              idsToDelete.map((id) => this.removeFromDatabase(id)),
            );

            this.logger.debug('finished removing old urls');
          }
        } catch (err) {
          this.logger.error(err.message, err.stack);
        }

        resolve('');
      });
    });

    return end;
  }

  /**
   * writeToDatabase writes a CSV to the database.
   * @param row a CreateWebsiteDto object.
   */
  async writeToDatabase(row: CreateWebsiteDto) {
    try {
      await this.websiteService.create(row);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `encountered error saving to database: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * removeFromDatabase removes a website and its
   * corresponding scan result from the datatabase.
   * @param id given Website's primary key.
   */
  async removeFromDatabase(id: number) {
    try {
      await this.websiteService.delete(id);
      this.logger.debug(`deleted website id ${id}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `encountered error deleting from database: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * getInvalidWebsiteIds compares an array of websites
   * agaist an array of valid urls and returns an array
   * containing the ids of any websites that do not have
   * a valid url.
   * @param currentWebsites array of Websites.
   * @param validUrls array of valid urls.
   */
  getInvalidWebsiteIds(
    currentWebsites: Website[],
    validUrls: string[],
  ): number[] {
    const idsToDelete = [];

    for (let i = 0; i < currentWebsites.length; i++) {
      if (!validUrls.includes(currentWebsites[i]['url'])) {
        idsToDelete.push(currentWebsites[i]['id']);
      }
    }

    return idsToDelete;
  }
}
