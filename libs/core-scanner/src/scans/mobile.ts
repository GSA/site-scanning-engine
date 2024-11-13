import { Logger } from 'pino';
import { Page } from 'puppeteer';

import { MobileScan } from 'entities/scan-data.entity';

export const buildMobileResult = async (
  logger: Logger,
  page: Page,
): Promise<MobileScan> => {
  const viewportMetaTag = await getHasViewportMetaTag(page);

  return {
    viewportMetaTag,
  };
};

async function getHasViewportMetaTag(page: Page): Promise<boolean> {
  const result = await page.evaluate(() => {
    const el = document.querySelector(
      "head > meta[name='viewport'][content*='width=']",
    );

    return el === null ? false : true;
  });

  return result;
}
