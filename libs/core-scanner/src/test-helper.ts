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

export let browserInstance: puppeteer.Browser;

export const useBrowser = async (
  handler: (browserInstance: puppeteer.Browser) => Promise<void>,
) => {
  if (!browserInstance) {
    browserInstance = await initBrowser();
  }
  return await handler(browserInstance);
};

const newPage = async (handler: (page: puppeteer.Page) => Promise<void>) => {
  return await useBrowser(async (browser) => {
    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    await handler(page);
    await page.close();
  });
};

/**
 * Creates a Puppeteer page and a Puppeteer response based on a local, mock, .mht file.
 *
 * @param handler
 * @param dumpFileName
 */
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

/**
 * Creates a Puppeteer page based on provided BODY HTML.
 *
 * @param handler
 * @param body
 */
export const newTestPageFromBody = async (
    handler: (ctx: {
      page: puppeteer.Page;
    }) => Promise<void>,
    body
) => {
  await newPage(async (page) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Page</title>
      </head>
      <body>    
          ${body}
      </body>
      </html>
      `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle2' });

    await handler({ page });
  });
};
