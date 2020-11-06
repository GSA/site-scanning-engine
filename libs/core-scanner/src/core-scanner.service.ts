import { BROWSER_TOKEN } from '@app/browser';
import { LoggerService } from '@app/logger';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { Scanner } from 'common/interfaces/scanner.interface';
import { join, split, takeRight, some, includes } from 'lodash';
import { Browser, Page, Response, Request } from 'puppeteer';
import { URL } from 'url';
import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { ScanStatus } from './scan-status';

@Injectable()
export class CoreScannerService
  implements Scanner<CoreInputDto, CoreResult>, OnModuleDestroy {
  constructor(
    @Inject(BROWSER_TOKEN) private browser: Browser,
    private logger: LoggerService,
  ) {}

  async scan(input: CoreInputDto) {
    const page = await this.browser.newPage();
    const url = this.getHttpsUrls(input.url);

    const result = new CoreResult();
    const website = new Website();
    website.id = input.websiteId;

    try {
      // load the url
      this.logger.debug(`loading ${url}`);
      const response = await page.goto(url);
      const redirectChain = response.request().redirectChain();

      // calculate the finalUrl
      const finalUrl = this.getFinalUrl(page);

      // construct the CoreResult from the scan fields
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
    } catch (e) {
      const err = e as Error;
      result.website = website;
      result.targetUrlBaseDomain = this.getBaseDomain(url);

      const dnsError = some(err.message, el =>
        includes('ERR_NAME_NOT_RESOLVED', el),
      );

      if (err.name == 'TimeoutError') {
        result.status = ScanStatus.Timeout;
      } else if (dnsError) {
        result.status = ScanStatus.DNSResolutionError;
      } else {
        this.logger.error(err.message, err.stack);
        result.status = ScanStatus.UnknownError;
      }
    }

    await page.close();
    this.logger.debug('closed puppeteer page');

    this.logger.debug(`result for ${url}: ${JSON.stringify(result)}`);
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

  private getHttpsUrls(url: string) {
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

  async onModuleDestroy() {
    await this.browser.close();
  }
}
