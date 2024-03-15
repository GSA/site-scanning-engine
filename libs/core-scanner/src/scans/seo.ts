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

  /**
   * #852
   * The following fields are experimental and were added in March 2024 for
   * prototyping purposes. They are not yet used in the application and may be
   * removed in the future.
   */
  const metaKeywordsContent = await findMetaContent(page, 'name', 'keywords');
  const metaRobotsContent = await findMetaContent(page, 'name', 'robots');
  const metaArticleSectionContent = await findMetaContent(
    page,
    'name',
    'article:section',
  );
  const metaArticleTagContent = await findMetaContent(
    page,
    'name',
    'article:tag',
  );
  const ogImageFinalUrl = await findOpenGraphTag(page, 'og:image');
  const dctermsKeywordsContent = await findMetaContent(
    page,
    'name',
    'dcterms.keywords',
  );
  const dcSubjectContent = await findMetaContent(page, 'name', 'dc.subject');
  const dctermsSubjectContent = await findMetaContent(
    page,
    'name',
    'dcterms.subject',
  );
  const dctermsAudienceContent = await findMetaContent(
    page,
    'name',
    'dcterms.audience',
  );
  const dcTypeContent = await findMetaContent(page, 'name', 'dc.type');
  const dctermsTypeContent = await findMetaContent(
    page,
    'name',
    'dcterms.type',
  );
  const dcDateContent = await findMetaContent(page, 'name', 'dc.date');
  const dcDateCreatedContent = await findMetaContent(
    page,
    'name',
    'dc.date.created',
  );
  const dctermsCreatedContent = await findMetaContent(
    page,
    'name',
    'dcterms.created',
  );
  const ogLocaleContent = await findOpenGraphTag(page, 'og:locale');
  const ogSiteNameContent = await findOpenGraphTag(page, 'og:site_name');
  const ogTypeContent = await findOpenGraphTag(page, 'og:type');
  const ogUrlContent = await findOpenGraphTag(page, 'og:url');
  const ogImageAltContent = await findOpenGraphTag(page, 'og:image:alt');
  const revisedContent = await findMetaContent(page, 'name', 'revised');
  const lastModifiedContent = await findMetaContent(
    page,
    'http-equiv',
    'last-modified',
  );
  const languageContent = await findMetaContent(page, 'name', 'language');
  const dateContent = await findMetaContent(page, 'name', 'date');
  const subjectContent = await findMetaContent(page, 'name', 'subject');
  const ownerContent = await findMetaContent(page, 'name', 'owner');
  const pagenameContent = await findMetaContent(page, 'name', 'pagename');
  const dcTitleContent = await findMetaContent(page, 'name', 'DC.title');
  const ogSiteName = await findMetaContent(page, 'name', 'og:site_name');
  const itemTypeContent = await findAttributeContent(page, 'itemtype');
  const itemScopeContent = await findAttributeContent(page, 'itemscope');
  const itemPropContent = await findAttributeContent(page, 'itemprop');
  const vocabContent = await findAttributeContent(page, 'vocab');
  const typeOfContent = await findAttributeContent(page, 'typeof');
  const propertyContent = await findAttributeContent(page, 'property');
  const contextContent = await findAttributeContent(page, 'context');
  const typeContent = await findTypeContent(page);
  const htmlLangContent = await findAttributeContent(page, 'lang');
  const hrefLangContent = await getHreflangContent(page, 'hreflang');
  const meContent = await getMeContent(page);

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
    // Beging March 2024 experimental fields
    metaKeywordsContent,
    metaRobotsContent,
    metaArticleSectionContent,
    metaArticleTagContent,
    ogImageFinalUrl,
    dctermsKeywordsContent,
    dcSubjectContent,
    dctermsSubjectContent,
    dctermsAudienceContent,
    dcTypeContent,
    dctermsTypeContent,
    dcDateContent,
    dcDateCreatedContent,
    dctermsCreatedContent,
    ogLocaleContent,
    ogSiteNameContent,
    ogTypeContent,
    ogUrlContent,
    ogImageAltContent,
    revisedContent,
    lastModifiedContent,
    languageContent,
    dateContent,
    subjectContent,
    ownerContent,
    pagenameContent,
    dcTitleContent,
    ogSiteName,
    itemTypeContent,
    itemScopeContent,
    itemPropContent,
    vocabContent,
    typeOfContent,
    propertyContent,
    contextContent,
    typeContent,
    htmlLangContent,
    hrefLangContent,
    meContent,
    // End March 2024 experimental fields
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

const findTypeContent = async (page: Page): Promise<string> => {
  const content = await page.evaluate(() => {
    const typeElements = document.querySelectorAll('link[type]');

    const typeValues = Array.from(
      new Set(
        Array.from(typeElements).map((el) => {
          return el.getAttribute('type').trim().toLowerCase();
        }),
      ),
    );

    return typeValues.join(',');
  });

  return content;
};

const getMeContent = async (page: Page): Promise<string> => {
  const content = await page.evaluate(() => {
    const meLink = document.querySelector('link[rel="me"]');

    if (meLink && meLink.hasAttribute('value')) {
      return meLink.getAttribute('value').trim();
    }

    return null;
  });

  return content;
};
