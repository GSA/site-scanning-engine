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

export const useBrowser = async () => {
  if (!browser) {
    browser = await initBrowser();
  }
  return browser;
};

const newPage = async () => {
  const browser = await useBrowser();
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  return page;
};

export const newTestPage = async (
  dumpFileName: string = '18f_gov_dump.mht',
) => {
  const page = await newPage();
  const path = join(PROJECT_ROOT, 'libs/core-scanner/src/', dumpFileName);
  const response = await page.goto(`file://${path}`, {
    waitUntil: 'networkidle2',
  });
  return { page, response };
};
