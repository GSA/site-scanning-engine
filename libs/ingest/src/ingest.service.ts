import { WebsiteService } from '@app/database/websites/websites.service';
import { HttpService, Injectable } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { parse } from '@fast-csv/parse';
import { CreateWebsiteDto } from '@app/database/websites/dto/create-website.dto';
import { LoggerService } from '@app/logger';

@Injectable()
export class IngestService {
  constructor(
    private httpService: HttpService,
    private websiteService: WebsiteService,
    private logger: LoggerService,
  ) {
    this.logger.setContext(IngestService.name);
  }

  private federalUrls =
    'https://raw.githubusercontent.com/GSA/data/master/dotgov-domains/current-federal.csv';

  async getUrls(): Promise<string> {
    const urls = await this.httpService
      .get(this.federalUrls)
      .pipe(map(resp => resp.data))
      .toPromise();
    return urls;
  }

  /**
   * writeUrls writes target urls to the Websites table.
   */
  async writeUrls(urls: string, maxRows?: number) {
    const stream = parse<CreateWebsiteDto, CreateWebsiteDto>({
      headers: [
        'url',
        'type',
        'agency',
        'organization',
        'city',
        'state',
        'securityContactEmail',
      ],
      renameHeaders: true,
      maxRows: maxRows,
    })
      .on('error', error => this.logger.error(error.message, error.stack))
      .on('data', async (row: CreateWebsiteDto) => {
        await this.websiteService.create(row);
      })
      .on('end', (rowCount: number) => {
        this.logger.debug(rowCount);
      });

    stream.write(urls);
    stream.end();
  }
}
