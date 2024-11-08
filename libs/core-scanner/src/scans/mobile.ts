import { Logger } from 'pino';
import { Page } from 'puppeteer';

import { MobileScan } from 'entities/scan-data.entity';

export const buildMobileResult = async (
  logger: Logger,
  page: Page,
): Promise<MobileScan> => {
  const viewportMetaTag = await getHasViewportMetaTag(logger, page);

  return {
    viewportMetaTag,
  };
};

async function getHasViewportMetaTag(logger: Logger, page: Page): Promise<boolean> {
  let result = false;
  try {
    result = await page.evaluate(() => {
      const el = document.querySelector(
        "head > meta[name='viewport'][content*='width=']",
      );
  
      return el === null ? false : true;
    });
  } catch(error) {
    logger.error({error}, `Error getting viewport meta tag: ${error}`);
  };

  return result;
}
