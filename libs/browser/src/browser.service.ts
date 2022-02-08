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
    await page.setCacheEnabled(false);
    let result: Result;
    try {
      result = await handler(page);
    } finally {
      await page.close();
    }
    return result;
  }

  async onModuleDestroy() {
    this.logger.log('Draining and clearing Puppeteer pool...');
    this.puppeteerPool.drain().then(() => this.puppeteerPool.clear());
  }
}
