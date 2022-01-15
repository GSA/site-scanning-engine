import { Browser, Page } from 'puppeteer';
import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

import { PUPPETEER_TOKEN } from './puppeteer.service';

@Injectable()
export class BrowserService implements OnModuleDestroy {
  private logger = new Logger(BrowserService.name);

  constructor(@Inject(PUPPETEER_TOKEN) private browser: Browser) {}

  async processPage<Result>(handler: (page: Page) => Promise<Result>) {
    this.logger.debug('Creating Puppeteer page...');
    const page = await this.browser.newPage();
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
    this.logger.log('Closing Puppeteer browser...');
    await this.browser.close();
  }
}
