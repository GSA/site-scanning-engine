/**
 * BrowserService is a Puppeteer manager. It manages the lifecycle of Puppeteer
 * instances so as to avoid Chromium memory leaks, crashes, etc.
 */
import { Browser, Page } from 'puppeteer';
import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

import { PuppeteerPool, PUPPETEER_TOKEN } from './puppeteer.service';

@Injectable()
export class BrowserService implements OnModuleDestroy {
  private logger = new Logger(BrowserService.name);

  constructor(@Inject(PUPPETEER_TOKEN) private puppeteerPool: PuppeteerPool) {}

  async useBrowser<Result>(handler: (browser: Browser) => Promise<Result>) {
    this.logger.debug('Requesting browser from Puppeteer pool...');
    const browser = await this.puppeteerPool.use(async (resource) => {
      this.logger.log({
        msg: `Using browser`,
        version: await resource.version(),
        userAgent: await resource.userAgent(),
        poolSize: this.puppeteerPool.size,
        poolAvailable: this.puppeteerPool.available,
      });
      return await handler(resource);
    });
    return browser;
  }

  async processPage<Result>(
    browser: Browser,
    handler: (page: Page) => Promise<Result>,
  ) {
    this.logger.debug('Creating Puppeteer page...');
    const page = await browser.newPage();
    const userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4182.0 Safari/537.36';
    await page.setUserAgent(userAgent);
    await page.setCacheEnabled(false);

    // Process page with a 60 second timeout.
    return new Promise<Result>((resolve, reject) => {
      setTimeout(() => {
        reject('Processing timed out');
      }, 60000);
      handler(page)
        .then(resolve)
        .catch(reject)
        .finally(() => page.close());
    });
  }

  async onModuleDestroy() {
    this.logger.log('Draining and clearing Puppeteer pool...');
    this.puppeteerPool.drain().then(() => this.puppeteerPool.clear());
  }
}
