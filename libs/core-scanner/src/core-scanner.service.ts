import { BROWSER_TOKEN, parseBrowserError } from '@app/browser';
import { LoggerService } from '@app/logger';
import {
  HttpService,
  HttpStatus,
  Inject,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { Scanner } from 'common/interfaces/scanner.interface';
import { join, split, takeRight } from 'lodash';
import { Browser, Page, Response, Request } from 'puppeteer';
import { URL } from 'url';
import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { ScanStatus } from './scan-status';
import { v4 } from 'uuid';

@Injectable()
export class CoreScannerService
  implements Scanner<CoreInputDto, CoreResult>, OnModuleDestroy {
  private page: Page;
  private response: Response;

  constructor(
    @Inject(BROWSER_TOKEN) private browser: Browser,
    private logger: LoggerService,
    private httpService: HttpService,
  ) {}

  async scan(input: CoreInputDto) {
    const url = this.getHttpsUrl(input.url);

    let result: CoreResult;

    try {
      // load a page
      this.page = await this.browser.newPage();

      // load the url
      this.logger.debug(`loading ${url}`);
      this.response = await this.page.goto(url);

      // do the redirect tst
      const notFoundTest = await this.notFoundTest(url);

      // construct the CoreResult
      result = this.buildResult(input, notFoundTest);
    } catch (error) {
      const err = error as Error;

      // build error result on error
      result = this.buildErrorResult(input, err);

      // log if the error is unknown
      if (result.status == ScanStatus.UnknownError) {
        this.logger.error(err.message, err.stack);
      }
    }

    await this.page.close();
    this.logger.debug('closed puppeteer page');

    this.logger.debug(`result for ${url}: ${JSON.stringify(result)}`);
    return result;
  }

  private buildResult(input: CoreInputDto, notFoundTest: boolean) {
    const url = this.getHttpsUrl(input.url);

    const result = new CoreResult();
    const website = new Website();
    website.id = input.websiteId;

    const redirectChain = this.response.request().redirectChain();
    const finalUrl = this.getFinalUrl(this.page);

    result.website = website;
    result.targetUrlRedirects = this.redirects(redirectChain);
    result.targetUrlBaseDomain = this.getBaseDomain(url);
    result.finalUrl = finalUrl;
    result.finalUrlMIMEType = this.getMIMEType(this.response);
    result.finalUrlIsLive = this.isLive(this.response);
    result.finalUrlBaseDomain = this.getBaseDomain(finalUrl);
    result.finalUrlSameDomain =
      this.getBaseDomain(url) === this.getBaseDomain(finalUrl);
    result.finalUrlSameWebsite =
      this.getPathname(url) == this.getPathname(finalUrl) &&
      this.getBaseDomain(url) == this.getBaseDomain(finalUrl);
    result.finalUrlStatusCode = this.response.status();
    result.status = ScanStatus.Completed;
    result.targetUrl404Test = notFoundTest;

    return result;
  }

  private buildErrorResult(input: CoreInputDto, err: Error) {
    const url = this.getHttpsUrl(input.url);
    const errorType = parseBrowserError(err);

    const website = new Website();
    website.id = input.websiteId;

    const result = new CoreResult();
    result.website = website;
    result.targetUrlBaseDomain = this.getBaseDomain(url);
    result.status = errorType;

    return result;
  }

  // 18f.gsa.gov -> gsa.gov
  private getBaseDomain(url: string) {
    const parsedUrl = new URL(url);
    const baseDomain = takeRight(split(parsedUrl.hostname, '.'), 2);
    return join(baseDomain, '.');
  }

  private redirects(requests: Request[]): boolean {
    return requests.length > 0;
  }

  private getFinalUrl(page: Page) {
    const finalUrl = page.url();
    return finalUrl;
  }

  private getMIMEType(res: Response) {
    const headers = res.headers();
    if (headers['Content-Type'] || headers['content-type']) {
      const contentType = headers['Content-Type'] || headers['content-type'];
      const mimetype = split(contentType, ';')[0];
      return mimetype;
    } else {
      return 'unknown';
    }
  }

  private getPathname(url: string) {
    const parsed = new URL(url);
    return parsed.pathname;
  }

  private getHttpsUrl(url: string) {
    if (!url.startsWith('https://')) {
      return `https://${url.toLowerCase()}`;
    } else {
      return url.toLowerCase();
    }
  }

  private isLive(res: Response) {
    const isLive = res.status() / 100 === 2; // 2xx family
    this.logger.debug(`status for ${res.url()} is ${res.status()}`);
    return isLive;
  }

  private async notFoundTest(url: string): Promise<boolean> {
    const randomUrl = new URL(url);
    randomUrl.pathname = `not-found-test${v4()}`;
    const resp = await this.httpService
      .get(randomUrl.toString(), {
        validateStatus: _ => {
          return true;
        },
      })
      .toPromise();

    return resp.status == HttpStatus.NOT_FOUND;
  }

  async onModuleDestroy() {
    await this.browser.close();
  }
}
