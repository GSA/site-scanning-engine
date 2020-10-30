import { BROWSER_TOKEN } from '@app/browser';
import { LoggerService } from '@app/logger';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { Scanner } from 'common/interfaces/scanner.interface';
import { join, split, takeRight } from 'lodash';
import { Browser, Page, Response } from 'puppeteer';
import { URL } from 'url';
import { CoreOutputDto } from './core.output.dto';

@Injectable()
export class CoreScannerService
  implements Scanner<CoreInputDto, CoreOutputDto>, OnModuleDestroy {
  constructor(
    @Inject(BROWSER_TOKEN) private browser: Browser,
    private logger: LoggerService,
  ) {}

  async scan(input: CoreInputDto) {
    const page = await this.browser.newPage();

    const url = this.getHttpsUrls(input.url);

    this.logger.debug(`loading ${url}`);

    const response = await page.goto(url);
    const redirects = response.request().redirectChain();

    const finalUrl = this.getFinalUrl(page);
    const result: CoreOutputDto = {
      websiteId: input.websiteId,
      targetUrlRedirects: redirects.length > 0,
      finalUrl: finalUrl,
      finalUrlMIMEType: this.getMIMEType(response),
      targetUrlBaseDomain: this.getBaseDomain(url),
      finalUrlIsLive: this.isLive(response),
      finalUrlBaseDomain: this.getBaseDomain(finalUrl),
      finalUrlSameDomain:
        this.getBaseDomain(finalUrl) === this.getBaseDomain(url),
      finalUrlSameWebsite:
        this.getPathname(finalUrl) === this.getPathname(url) &&
        this.getBaseDomain(finalUrl) == this.getBaseDomain(url),
      finalUrlStatusCode: response.status(),
    };

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

  private getFinalUrl(page: Page) {
    const finalUrl = page.url();
    return finalUrl;
  }

  private getMIMEType(res: Response) {
    const headers = res.headers();
    if (headers['Content-Type'] || headers['content-type']) {
      return headers['Content-Type'] || headers['content-type'];
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
