import { Module } from '@nestjs/common';
import { BrowserService } from './browser.service';
import { PuppeteerService } from './puppeteer.service';

@Module({
  providers: [BrowserService, PuppeteerService],
  exports: [BrowserService],
})
export class BrowserModule {}
