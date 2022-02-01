import { Agent } from 'https';
import { join, split, takeRight } from 'lodash';
import { Browser, Page, Response, Request } from 'puppeteer';
import { URL } from 'url';
import { v4 } from 'uuid';
import {
  HttpService,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';

import { BROWSER_TOKEN, parseBrowserError } from '@app/browser';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { Scanner } from 'libs/scanner.interface';

import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';

import { ScanStatus } from './scan-status';

@Injectable()
export class CoreScannerService
  implements Scanner<CoreInputDto, CoreResult>, OnModuleDestroy
{
  private logger = new Logger(CoreScannerService.name);

  constructor(
    @Inject(BROWSER_TOKEN) private browser: Browser,
    private httpService: HttpService,
  ) {}

  async scan(input: CoreInputDto) {
    const url = this.getHttpsUrl(input.url);
    const logData = {
      ...input,
    };

    let result: CoreResult;
    let page: Page;

    try {
      // load a page
      page = await this.browser.newPage();
      await page.setCacheEnabled(false);

      // load the url
      this.logger.debug({
        msg: `loading ${url}`,
        ...logData,
      });
      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
      });

      // do the redirect test
      const notFoundTest = await this.notFoundTest(url);

      // construct the CoreResult
      result = this.buildResult(input, notFoundTest, page, response);
    } catch (error) {
      const err = error as Error;

      // build error result on error
      result = this.buildErrorResult(input, err);

      // log if the error is unknown
      if (result.status == ScanStatus.UnknownError) {
        this.logger.warn({
          msg: `Unknown Error calling ${input.url}: ${err.message}`,
          ...logData,
        });
      }
    } finally {
      await page.close();
      this.logger.debug({ msg: 'closed puppeteer page', ...logData });
    }

    this.logger.log({ msg: 'core scan results', ...logData });
    return result;
  }

  private buildResult(
    input: CoreInputDto,
    notFoundTest: boolean,
    page: Page,
    response: Response,
  ) {
    const url = this.getHttpsUrl(input.url);

    const result = new CoreResult();
    const website = new Website();
    website.id = input.websiteId;

    const redirectChain = response.request().redirectChain();
    const finalUrl = this.getFinalUrl(page);

    result.website = website;
    result.targetUrlRedirects = this.redirects(redirectChain);
    result.targetUrlBaseDomain = this.getBaseDomain(url);
    result.finalUrl = finalUrl;
    result.finalUrlMIMEType = this.getMIMEType(response);
    result.finalUrlIsLive = this.isLive(response);
    result.finalUrlBaseDomain = this.getBaseDomain(finalUrl);
    result.finalUrlSameDomain =
      this.getBaseDomain(url) === this.getBaseDomain(finalUrl);
    result.finalUrlSameWebsite =
      this.getPathname(url) == this.getPathname(finalUrl) &&
      this.getBaseDomain(url) == this.getBaseDomain(finalUrl);
    result.finalUrlStatusCode = response.status();
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
    return isLive;
  }

  private async notFoundTest(url: string): Promise<boolean> {
    const randomUrl = new URL(url);
    randomUrl.pathname = `not-found-test${v4()}`;

    const agent = new Agent({
      rejectUnauthorized: false, // lgtm[js/disabling-certificate-validation]
    });

    const resp = await this.httpService
      .get(randomUrl.toString(), {
        validateStatus: (_) => {
          return true;
        },
        httpsAgent: agent,
      })
      .toPromise();

    return resp.status == HttpStatus.NOT_FOUND;
  }

  async onModuleDestroy() {
    await this.browser.close();
  }
}
