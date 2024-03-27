import { Logger } from 'pino';
import { Page } from 'puppeteer';
import { HTTPResponse } from 'puppeteer';
import { SeoScan } from 'entities/scan-data.entity';

export const buildSeoResult = async (
  logger: Logger,
  page: Page,
  response: HTTPResponse,
): Promise<SeoScan> => {
  const ogTitleFinalUrl = await findOpenGraphTag(page, 'og:title');
  const ogDescriptionFinalUrl = await findOpenGraphTag(page, 'og:description');
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
  const mainElementFinalUrl = await findMainElement(page);
  const canonicalLink =
    (await findCanonicalLinkInHtml(page)) ??
    (await findCanonicalLInkInResponseHeaders(response)) ??
    null;
  const pageTitle = await findPageTitleText(page);
  const metaDescriptionContent = await findMetaDescriptionContent(page);
  const hreflangCodes =
    (await findHrefLangCodes(page)) ??
    (await extractHrefLangValues(response)) ??
    null;
  const metaKeywordsContent = await findMetaContent(page, 'name', 'keywords');
  const ogImageContent = await findOpenGraphTag(page, 'og:image');
  const ogTypeContent = await findOpenGraphTag(page, 'og:type');
  const ogUrlContent = await findOpenGraphTag(page, 'og:url');
  const htmlLangContent = await findAttributeContent(page, 'lang');
  const hrefLangContent = await getHreflangContent(page, 'hreflang');

  return {
    ogTitleFinalUrl,
    ogDescriptionFinalUrl,
    ogArticlePublishedFinalUrl,
    ogArticleModifiedFinalUrl,
    mainElementFinalUrl,
    canonicalLink,
    pageTitle,
    metaDescriptionContent,
    hreflangCodes,
    metaKeywordsContent,
    ogImageContent,
    ogTypeContent,
    ogUrlContent,
    htmlLangContent,
    hrefLangContent,
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

const findMainElement = async (page: Page) => {
  const main = await page.evaluate(() => {
    const main = [...document.getElementsByTagName('main')];

    return main.length > 0;
  });

  return main;
};

const findCanonicalLinkInHtml = async (page: Page): Promise<string | null> => {
  const canonicalLinkResult = await page.evaluate(() => {
    const canonicalLink = document.querySelector<Element>(
      'link[rel="canonical"]',
    );
    return canonicalLink ? canonicalLink.getAttribute('href') : null;
  });

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

const findPageTitleText = async (page: Page): Promise<string> => {
  return await page.evaluate(() => document.title.trim());
};

const findMetaDescriptionContent = async (
  page: Page,
): Promise<string | null> => {
  const content = await page.evaluate(() => {
    const metaDescription = document.querySelector('meta[name="description"]');

    if (metaDescription && metaDescription.hasAttribute('content')) {
      return metaDescription.getAttribute('content').trim();
    }

    return null;
  });

  return content;
};

const findHrefLangCodes = async (page: Page): Promise<string> => {
  const languageCodes = await page.evaluate(() => {
    const hreflangElements = document.querySelectorAll(
      'link[rel="alternate"][hreflang]',
    );

    const hreflangValues = Array.from(hreflangElements).map((el) => {
      return el.getAttribute('hreflang').trim().toLowerCase();
    });

    return hreflangValues;
  });

  return languageCodes.join(',');
};

function extractHrefLangValues(response: HTTPResponse): string | null {
  const linkHeader = response.headers()['link'];
  if (!linkHeader) {
    return null;
  }

  const hrefLangRegex = /hreflang="([^"]+)"/g;

  const matches = linkHeader.match(hrefLangRegex);
  if (!matches || matches.length === 0) {
    return null;
  }

  return matches.map((match) => match.split('"')[1]).join(',');
}

const findMetaContent = async (
  page: Page,
  attribute: string,
  value: string,
): Promise<string> => {
  const content = await page.evaluate(
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

  return content;
};

const findAttributeContent = async (
  page: Page,
  attribute: string,
): Promise<string> => {
  const content = await page.evaluate((attribute: string) => {
    const element = document.querySelector(`[${attribute}]`);

    if (element && element.hasAttribute(attribute)) {
      return element.getAttribute(attribute).trim();
    }

    return null;
  }, attribute);

  return content;
};

const getHreflangContent = async (
  page: Page,
  attribute: string,
): Promise<string> => {
  const content = await page.evaluate((attribute: string) => {
    const hreflangElements = document.querySelectorAll(
      `link[rel="alternate"][${attribute}]`,
    );

    const hreflangValues = Array.from(hreflangElements).map((el) => {
      return el.getAttribute(attribute).trim().toLowerCase();
    });

    return hreflangValues.join(',');
  }, attribute);

  return content;
};
