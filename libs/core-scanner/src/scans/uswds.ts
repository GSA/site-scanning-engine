import { sum, uniq } from 'lodash';
import { Logger } from 'pino';
import { HTTPResponse, Page } from 'puppeteer';
import { logCount } from '../../../logging/src/metric-utils';

import { UswdsScan } from 'entities/scan-data.entity';

export function createUswdsScanner( getCSSRequests: () => string[] , page: Page, ) {
  return async (logger: Logger, response: HTTPResponse) => {
    return buildUswdsResult(
      logger,
      getCSSRequests(),
      await (response ? response.text() : ''),
      page,
    );
  };
}

export async function buildUswdsResult( parentLogger: Logger, cssPages: string[], htmlText: string, page: Page, ): Promise<UswdsScan> {
  const logger = parentLogger.child({ function: 'buildUswdsResult', pageUrl: page.url() });
  const pageResults = await page.evaluate(() => {
    const usaClasses = [...document.querySelectorAll("[class^='usa-']")];
    const usaClassesCount = Math.round(Math.sqrt(usaClasses.length)) * 5;

    const classList = usaClasses
      .map((element) => [...element.classList])
      .reduce((acc, classes) => acc.concat(classes), []);

    const filteredClasses =
      classList &&
      classList.filter(
        (cls) =>
          cls.startsWith('usa-') && !cls.includes('--') && !cls.includes('__'),
      );

    const uniqueClassesObj =
      filteredClasses &&
      filteredClasses.reduce((acc, cls) => {
        if (!acc[cls]) {
          acc[cls] = true;
        }
        return acc;
      }, {});

    const uniqueClasses = Object.keys(uniqueClassesObj).sort().join(',');

    const selectorResults = [
      ...document.querySelectorAll('.usa-banner__button-text, .usa-banner-button-text, .usa-media-block__body, .usa-banner__header-text, .usa-media_block-body'),
    ]
      .map((el) => el.textContent.replace(/’/g, "'"));

    const hasHeresHowYouKnowBannerEnglish = selectorResults.some((text) => text.includes("Here's how you know"));
    const hasHeresHowYouKnowBannerSpanish = selectorResults.some((text) => text.includes("Así es como usted puede verificarlo"));
    const hasHeresHowYouKnowBanner = hasHeresHowYouKnowBannerEnglish || hasHeresHowYouKnowBannerSpanish;

    const officialWebsiteOfUSGovEnglish = selectorResults.some((text) => text.includes("official website of the United States government"));
    const officialWebsiteOfUSGovSpanish = selectorResults.some((text) => text.includes("sitio oficial del Gobierno de Estados Unidos"));

    const officialWebsitesUseGovEnglish = selectorResults.some((text) => text.includes("Official websites use .gov"));
    const officialWebsitesUseMilEnglish = selectorResults.some((text) => text.includes("Official websites use .mil"));
    const officialWebsitesUseGovSpanish = selectorResults.some((text) => text.includes("Los sitios web oficiales usan .gov"));
    const officialWebsitesUseMilSpanish = selectorResults.some((text) => text.includes("Los sitios web oficiales usan .mil"));

    const secureWebsitesUseGovEnglish = selectorResults.some((text) => text.includes("Secure .gov websites use HTTPS"));
    const secureWebsitesUseMilEnglish = selectorResults.some((text) => text.includes("Secure .mil websites use HTTPS"));
    const secureWebsitesUseGovSpanish = selectorResults.some((text) => text.includes("Los sitios web seguros .gov usan HTTPS"));
    const secureWebsitesUseMilSpanish = selectorResults.some((text) => text.includes("Los sitios web seguros .mil usan HTTPS"));

    const heresHowYouKnowBanner2 = (officialWebsiteOfUSGovEnglish || officialWebsiteOfUSGovSpanish) && 
      (officialWebsitesUseGovEnglish || officialWebsitesUseGovSpanish || officialWebsitesUseMilEnglish || officialWebsitesUseMilSpanish) &&
      (secureWebsitesUseGovEnglish || secureWebsitesUseGovSpanish || secureWebsitesUseMilEnglish || secureWebsitesUseMilSpanish);

    return {
      usaClassesCount,
      uniqueClasses,
      hasHeresHowYouKnowBannerEnglish,
      hasHeresHowYouKnowBannerSpanish,
      hasHeresHowYouKnowBanner,
      heresHowYouKnowBanner2,
    };
  });

  let hasHeresHowYouKnowBanner2 = pageResults.heresHowYouKnowBanner2;
  if( !hasHeresHowYouKnowBanner2 ) {
    logger.info('Checking for "Here\'s how you know" banner version 2 using text search');
    hasHeresHowYouKnowBanner2 = heresHow2Check(htmlText, logger);
  }

  if (pageResults.hasHeresHowYouKnowBannerEnglish) {
    logCount(logger, {}, 'scanner.page.primary.scan.uswds.heresHowYouKnowBannerEnglish', 'Found English "Here\'s how you know" banner');
  }
  if (pageResults.hasHeresHowYouKnowBannerSpanish) {
    logCount(logger, {}, 'scanner.page.primary.scan.uswds.heresHowYouKnowBannerSpanish', 'Found Spanish "Here\'s how you know" banner');
  }
  if (!pageResults.hasHeresHowYouKnowBanner) {
    logCount(logger, {}, 'scanner.page.primary.scan.uswds.heresHowYouKnowBannerNotFound', '"Here\'s how you know" banner not found');
  }
  if (hasHeresHowYouKnowBanner2) {
    logCount(logger, {}, 'scanner.page.primary.scan.uswds.heresHowYouKnowBanner2', 'Found "Here\'s how you know" banner version 2');
  }



  const uswdsSemanticVersion = uswdsSemVer(logger, cssPages);
  const uswdsVersionScoreAdjustment = 100;
  const result = {
    usaClasses: pageResults.usaClassesCount,
    usaClassesUsed: pageResults.uniqueClasses,
    uswdsString: uswdsInHtml(logger, htmlText),
    uswdsInlineCss: inlineUsaCssCount(htmlText),
    uswdsUsFlag: uswdsFlagDetected(htmlText),
    uswdsUsFlagInCss: uswdsFlagInCSS(cssPages),
    uswdsStringInCss: uswdsInCss(cssPages),
    uswdsPublicSansFont: uswdsPublicSansFont(cssPages),
    uswdsSemanticVersion,
    uswdsVersion: uswdsSemanticVersion ? uswdsVersionScoreAdjustment : 0,
    uswdsCount: 0,
    heresHowYouKnowBanner: pageResults.hasHeresHowYouKnowBanner,
    heresHowYouKnowBanner2: hasHeresHowYouKnowBanner2,
  };

  result.uswdsCount = sum([
    result.usaClasses,
    result.uswdsString,
    result.uswdsInlineCss,
    result.uswdsUsFlag,
    result.uswdsUsFlagInCss,
    result.uswdsStringInCss,
    result.uswdsPublicSansFont,
    result.uswdsVersion,
  ]);
  return result;
}

export function htmlContainsText(htmlText: string, searchText: string): boolean {
  return htmlText.toLowerCase().includes(searchText.toLowerCase());
}

export function heresHow2Check(htmlText: string, logger:Logger ): boolean {
  const officialWebsiteOfUSGovEnglish = htmlContainsText(htmlText, "official website of the United States government");
  logger.debug(`found official website of US Gov English: ${officialWebsiteOfUSGovEnglish}`);
  const officialWebsiteOfUSGovSpanish = htmlContainsText(htmlText, "sitio oficial del Gobierno de Estados Unidos");
  logger.debug(`found official website of US Gov Spanish: ${officialWebsiteOfUSGovSpanish}`);

  const officialWebsitesUseGovEnglish = htmlContainsText(htmlText, "Official websites use .gov");
  logger.debug(`found official websites use .gov English: ${officialWebsitesUseGovEnglish}`);
  const officialWebsitesUseMilEnglish = htmlContainsText(htmlText, "Official websites use .mil");
  logger.debug(`found official websites use .mil English: ${officialWebsitesUseMilEnglish}`);
  const officialWebsitesUseGovSpanish = htmlContainsText(htmlText, "Los sitios web oficiales usan .gov");
  logger.debug(`found official websites use .gov Spanish: ${officialWebsitesUseGovSpanish}`);
  const officialWebsitesUseMilSpanish = htmlContainsText(htmlText, "Los sitios web oficiales usan .mil");
  logger.debug(`found official websites use .mil Spanish: ${officialWebsitesUseMilSpanish}`);

  const secureWebsitesUseGovEnglish = htmlContainsText(htmlText, "Secure .gov websites use HTTPS");
  logger.debug(`found secure websites use .gov English: ${secureWebsitesUseGovEnglish}`);
  const secureWebsitesUseMilEnglish = htmlContainsText(htmlText, "Secure .mil websites use HTTPS");
  logger.debug(`found secure websites use .mil English: ${secureWebsitesUseMilEnglish}`);
  const secureWebsitesUseGovSpanish = htmlContainsText(htmlText, "Los sitios web seguros .gov usan HTTPS");
  logger.debug(`found secure websites use .gov Spanish: ${secureWebsitesUseGovSpanish}`);
  const secureWebsitesUseMilSpanish = htmlContainsText(htmlText, "Los sitios web seguros .mil usan HTTPS");
  logger.debug(`found secure websites use .mil Spanish: ${secureWebsitesUseMilSpanish}`);

  return (officialWebsiteOfUSGovEnglish || officialWebsiteOfUSGovSpanish) && 
    (officialWebsitesUseGovEnglish || officialWebsitesUseGovSpanish || officialWebsitesUseMilEnglish || officialWebsitesUseMilSpanish) &&
    (secureWebsitesUseGovEnglish || secureWebsitesUseGovSpanish || secureWebsitesUseMilEnglish || secureWebsitesUseMilSpanish);
}

const uswdsInHtml = (logger: Logger, htmlText: string) => {
  const re = /uswds/g;
  const occurrenceCount = [...htmlText.matchAll(re)].length;
  logger.debug(`uswds occurs ${occurrenceCount} times`);
  return occurrenceCount;
};

const inlineUsaCssCount = (htmlText: string) => {
  const re = /\.usa-/g;
  const occurrenceCount = [...htmlText.matchAll(re)].length;
  return occurrenceCount;
};

const uswdsFlagDetected = (htmlText: string) => {
  const re =
    /us_flag_small.png|favicon-57.png|favicon-192.png|favicon-72.png|favicon-144.png|favicon-114.png/;
  return htmlText.match(re) ? 20 : 0;
};

const uswdsInCss = (cssPages: string[]) => {
  const re = /uswds/i;
  return cssPages.some((page) => page.match(re)) ? 20 : 0;
};

const uswdsFlagInCSS = (cssPages: string[]) => {
  const re =
    /us_flag_small.png|favicon-57.png|favicon-192.png|favicon-72.png|favicon-144.png|favicon-114.png/;
  return cssPages.some((page) => page.match(re)) ? 20 : 0;
};

const uswdsPublicSansFont = (cssPages: string[]) => {
  const re = /[Pp]ublic.[Ss]ans/;
  return cssPages.some((page) => page.match(re)) ? 40 : 0;
};

const uswdsSemVer = (logger: Logger, cssPages: string[]): string | null => {
  const re = /uswds v?[0-9.]*/i;

  const versions =
    cssPages &&
    cssPages
      .map((page) => page.match(re))
      .filter(Boolean)
      .map((match) => match[0].split(' ')[1]);
  const uniqueVersions = uniq(versions);

  if (uniqueVersions.length > 1) {
    logger.debug(`found multiple USWDS versions ${uniqueVersions}`);
  }
  return uniqueVersions[0] || null;
};
