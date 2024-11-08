import { Logger } from 'pino';
import { Page } from 'puppeteer';
import { HTTPResponse } from 'puppeteer';
import { SeoScan } from 'entities/scan-data.entity';
import { LoggerModule } from 'nestjs-pino';

export const buildSeoResult = async (
  logger: Logger,
  page: Page,
  response: HTTPResponse,
): Promise<SeoScan> => {
  const ogTitleFinalUrl = await findOpenGraphTag(logger, page, 'og:title');
  const ogDescriptionFinalUrl = await findOpenGraphTag(logger, page, 'og:description');
  const ogArticlePublishedFinalUrl = await findOpenGraphDates(
    logger,
    page,
    'article:published_time',
  );
  const ogArticleModifiedFinalUrl = await findOpenGraphDates(
    logger,
    page,
    'article:modified_time',
  );
  const mainElementFinalUrl = await findMainElement(logger, page);
  const canonicalLink =
    (await findCanonicalLinkInHtml(logger, page)) ??
    (await findCanonicalLInkInResponseHeaders(response)) ??
    null;
  const pageTitle = await findPageTitleText(logger, page);
  const metaDescriptionContent = await findMetaDescriptionContent(logger, page);
  const metaKeywordsContent = await findMetaContent(logger, page, 'name', 'keywords');
  const ogImageContent = await findOpenGraphTag(logger, page, 'og:image');
  const ogTypeContent = await findOpenGraphTag(logger, page, 'og:type');
  const ogUrlContent = await findOpenGraphTag(logger, page, 'og:url');
  const htmlLangContent = await findHtmlLangContent(logger, page);
  const hrefLangContent = await findHreflangContent(logger, page);

  return {
    ogTitleFinalUrl,
    ogDescriptionFinalUrl,
    ogArticlePublishedFinalUrl,
    ogArticleModifiedFinalUrl,
    mainElementFinalUrl,
    canonicalLink,
    pageTitle,
    metaDescriptionContent,
    metaKeywordsContent,
    ogImageContent,
    ogTypeContent,
    ogUrlContent,
    htmlLangContent,
    hrefLangContent,
  };
};

const findOpenGraphTag = async (logger: Logger, page: Page, target: string) => {
  let openGraphResult = null;
  try {
    openGraphResult = await page.evaluate((target: string) => {
      const ogTag = document.querySelector<Element>(
        `head > meta[property="${target}"], head > meta[name="${target}"]`,
      );
  
      let result: string | null = null;
      if (ogTag) {
        result = ogTag.getAttribute('content');
      }
      return result;
    }, target);
  } catch (error) {
    logger.error({error}, `Error finding ${target} tag: ${error.message}`);
  }

  return openGraphResult;
};

const findOpenGraphDates = async (
  logger: Logger,
  page: Page,
  target: string,
) => {
  const targetDate: string = await findOpenGraphTag(logger, page, target);

  if (targetDate) {
    try {
      const date = new Date(targetDate);
      if (isNaN(date.getTime())) {
        return null;
      } else {
        return date;
      }
    } catch (e) {
      const err = e as Error;
      logger.warn(`Could not parse date ${targetDate}: ${err.message}`);
      return null;
    }
  }
};

const findMainElement = async (logger: Logger, page: Page) => {
  let main = false;
  try {
    main = await page.evaluate(() => {
      const main = [...document.getElementsByTagName('main')];
  
      return main.length > 0;
    });
  } catch (error) {
    logger.error({error}, `Error finding main element: ${error.message}`);
  }

  return main;
};

const findCanonicalLinkInHtml = async (logger: Logger, page: Page): Promise<string | null> => {
  let canonicalLinkResult = null;
  try {
    canonicalLinkResult = await page.evaluate(() => {
      const canonicalLink = document.querySelector<Element>(
        'link[rel="canonical"]',
      );
      return canonicalLink ? canonicalLink.getAttribute('href') : null;
    });
  } catch (error) {
    logger.error({error}, `Error finding canonical link: ${error.message}`);
  }

  return canonicalLinkResult;
};

const findCanonicalLInkInResponseHeaders = async (
  response: HTTPResponse,
): Promise<string | null> => {
  const headers = await response.headers();

  for (const key in headers) {
    if (key.toLowerCase() === 'link') {
      const value = headers[key];
      if (value.toLowerCase().includes('rel=canonical')) {
        const regex = /https?:\/\/[^;]+(?=; rel="canonical")/i;
        const matches = value.match(regex);
        return matches ? matches[0] : null;
      }
    }
  }

  return null;
};

const findPageTitleText = async (logger: Logger, page: Page): Promise<string> => {
  try {
    await page.evaluate(() => {
      const title = document.title;
      return typeof title === 'string' ? title.trim() : '';
    });
  } catch (error) {
    logger.error({error}, `Error finding page title: ${error.message}`);
    return '';
  }
  
};

const findMetaDescriptionContent = async (
  logger: Logger,
  page: Page,
): Promise<string | null> => {
  let content = null;
  try {
    content = await page.evaluate(() => {
      const metaDescription = document.querySelector('meta[name="description"]');
  
      if (metaDescription && metaDescription.hasAttribute('content')) {
        return metaDescription.getAttribute('content').trim();
      }
  
      return null;
    });
  } catch (error) {
    logger.error({error}, `Error finding meta description: ${error.message}`);
  }

  return content;
};

const findMetaContent = async (
  logger: Logger,
  page: Page,
  attribute: string,
  value: string,
): Promise<string> => {
  let content = null;
  try {
    content = await page.evaluate(
      (attribute: string, value: string) => {
        const metaDescription = document.querySelector(
          `meta[${attribute}="${value}"]`,
        );
  
        if (metaDescription && metaDescription.hasAttribute('content')) {
          return metaDescription.getAttribute('content').trim();
        }
  
        return null;
      },
      attribute,
      value,
    );
  } catch (error) {
    logger.error({error}, `Error finding meta content: ${error.message}`);
  }

  return content;
};

const findHtmlLangContent = async (logger: Logger, page: Page): Promise<string> => {
  let content = null;
  try {
    content = await page.evaluate(() => {
      const element = document.querySelector('[lang]');
  
      if (element && element.hasAttribute('lang')) {
        return element.getAttribute('lang').trim();
      }
  
      return null;
    });
  } catch (error) {
    logger.error({error}, `Error finding html lang: ${error.message}`);
  }

  return content;
};

const findHreflangContent = async (logger: Logger, page: Page): Promise<string> => {
  let content = null;
  try {
    content = await page.evaluate(() => {
      const hreflangElements = document.querySelectorAll(
        'link[rel="alternate"][hreflang]',
      );
  
      const hreflangValues = Array.from(hreflangElements).map((el) => {
        return el.getAttribute('hreflang').trim().toLowerCase();
      });
  
      return hreflangValues.join(',');
    });
  } catch (error) {
    logger.error({error}, `Error finding hreflang: ${error.message}`);
  }

  return content;
};
