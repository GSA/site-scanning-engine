import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { ScanResult } from './scan-result';

@Injectable()
export class HeadlessService {
  async startScan(
    url: string,
    agency: string,
    branch: string,
  ): Promise<ScanResult> {
    const browser = await puppeteer.launch({ headless: true });

    const redirectChain: string[] = [];
    const page = await browser.newPage();

    page.on('request', async request => {
      if (request.isNavigationRequest()) {
        redirectChain.push(request.url());
      }
    });

    const response = await page.goto(url);

    const scanResult = new ScanResult(
      url,
      response.url(),
      response.status(),
      redirectChain,
      agency,
      branch,
    );

    await browser.close();
    return scanResult;
  }
}
