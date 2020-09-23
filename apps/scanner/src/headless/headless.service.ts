import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class HeadlessService {
  async startScan(url: string): Promise<string> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url);
    const html = await page.content();
    await browser.close();
    return html;
  }
}
