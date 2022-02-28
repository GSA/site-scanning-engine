import { Logger } from 'pino';
import { Page } from 'puppeteer';

import { SeoScan } from 'entities/scan-data.entity';

export const buildSeoResult = async (
  logger: Logger,
  page: Page,
): Promise<SeoScan> => {
  // seo
  return {
    ogTitleFinalUrl: await findOpenGraphTag(page, 'og:title'),
    ogDescriptionFinalUrl: await findOpenGraphTag(page, 'og:description'),
    ogArticlePublishedFinalUrl: await findOpenGraphDates(
      logger,
      page,
      'article:published_date',
    ),
    ogArticleModifiedFinalUrl: await findOpenGraphDates(
      logger,
      page,
      'article:modified_date',
    ),
    mainElementFinalUrl: await findMainElement(page),
  };
};

const findOpenGraphTag = async (page: Page, target: string) => {
  const openGraphResult = await page.evaluate((target: string) => {
    const ogTag = document.querySelector<Element>(
      `head > meta[property="${target}"]`,
    );

    let result: string | null = null;
    if (ogTag) {
      result = ogTag.getAttribute('content');
    }
    return result;
  }, target);

  return openGraphResult;
};

const findOpenGraphDates = async (
  logger: Logger,
  page: Page,
  target: string,
) => {
  const targetDate: string = await findOpenGraphTag(page, target);

  if (targetDate) {
    try {
      const date = new Date(targetDate);
      return date;
    } catch (e) {
      const err = e as Error;
      logger.warn(`Could not parse date ${targetDate}: ${err.message}`);
      return null;
    }
  }
};

const findMainElement = async (page: Page) => {
  const main = await page.evaluate(() => {
    const main = [...document.getElementsByTagName('main')];

    return main.length > 0;
  });

  return main;
};
