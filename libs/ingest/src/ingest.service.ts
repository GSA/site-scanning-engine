import { WebsiteService } from '@app/database/websites/websites.service';
import { HttpService, Injectable } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { parse } from '@fast-csv/parse';
import { CreateWebsiteDto } from '@app/database/websites/dto/create-website.dto';
import { LoggerService } from '@app/logger';
import { SubdomainRow } from './subdomain-row.interface';

@Injectable()
export class IngestService {
  constructor(
    private httpService: HttpService,
    private websiteService: WebsiteService,
    private logger: LoggerService,
  ) {
    this.logger.setContext(IngestService.name);
  }

  private currentFederalSubdomains =
    'https://raw.githubusercontent.com/GSA/data/master/dotgov-websites/site-scanning/current-federal-subdomains.csv';

  async getUrls(): Promise<string> {
    const urls = await this.httpService
      .get(this.currentFederalSubdomains)
      .pipe(map((resp) => resp.data))
      .toPromise();
    return urls;
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
      ],
      renameHeaders: true, // discard the existing headers to ease parsing
      maxRows: maxRows,
    })
      .transform(
        (data: SubdomainRow): CreateWebsiteDto => ({
          ...data,
          website: data.url.toLowerCase(),
          agencyCode: data.agencyCode ? parseInt(data.agencyCode) : null,
          bureauCode: data.bureauCode ? parseInt(data.bureauCode) : null,
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
}
