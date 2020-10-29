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

    redirects.forEach(req => {
      this.logger.debug(req.url());
    });

    const finalUrl = this.getFinalUrl(page);
    const result: CoreOutputDto = {
      websiteId: input.websiteId,
      targetUrlRedirects: redirects.length > 0,
      finalUrl: finalUrl,
      finalUrlIsLive: this.isLive(response),
      finalUrlBaseDomain: this.getBaseDomain(finalUrl),
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

  private getHttpsUrls(url: string) {
    if (!url.startsWith('https://')) {
      return `https://${url.toLowerCase()}`;
    } else {
      return url.toLowerCase();
    }
  }

  private isLive(res: Response) {
    const isLive = res.status() / 100 == 2; // 2xx family
    return isLive;
  }

  async onModuleDestroy() {
    await this.browser.close();
  }
}
