import { join } from 'path';
import * as puppeteer from 'puppeteer';

// This should map to the directory containing the package.json.
// By convention, assume that the originating process was run from the root
// directory.
const PROJECT_ROOT = process.cwd();

const initBrowser = async () => {
  return await puppeteer.launch({
    args: ['--no-sandbox'],
  });
};

let browser: puppeteer.Browser;

export const useBrowser = async (
  handler: (browser: puppeteer.Browser) => Promise<void>,
) => {
  if (!browser) {
    browser = await initBrowser();
  }
  return await handler(browser);
};

const newPage = async (handler: (page: puppeteer.Page) => Promise<void>) => {
  return await useBrowser(async (browser) => {
    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    await handler(page);
    await browser.close();
  });
};

export const newTestPage = async (
  handler: (ctx: {
    page: puppeteer.Page;
    response: puppeteer.HTTPResponse;
    sourceUrl: string;
  }) => Promise<void>,
  dumpFileName = '18f_gov_dump.mht',
) => {
  await newPage(async (page) => {
    const path = join(PROJECT_ROOT, 'libs/core-scanner/test', dumpFileName);
    const sourceUrl = `file://${path}`;
    const response = await page.goto(sourceUrl, {
      waitUntil: 'networkidle2',
    });
    await handler({ page, response, sourceUrl });
  });
};
