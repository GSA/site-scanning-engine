import { sum, uniq } from 'lodash';
import { Logger } from 'pino';
import { Page, HTTPResponse } from 'puppeteer';
import { logCount, logTimer } from '../metric-utils';

import { UswdsScan } from 'entities/scan-data.entity';

export const createUswdsScanner = (
  {
    logger,
    getCSSRequests,
  }: { logger: Logger; getCSSRequests: () => string[] },
  page: Page,
) => {
  return async (response: HTTPResponse) => {
    return buildUswdsResult(
      logger,
      getCSSRequests(),
      await response.text(),
      page,
    );
  };
};

export const buildUswdsResult = async (
  parentLogger: Logger,
  cssPages: string[],
  htmlText: string,
  page: Page,
): Promise<UswdsScan> => {
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
      ...document.querySelectorAll('.usa-banner__button-text, .usa-banner-button-text'),
    ]
      .map((el) => el.textContent.replace(/’/g, "'"));

    const hasHeresHowYouKnowBannerEnglish = selectorResults.some((text) => text.includes("Here's how you know"));
    const hasHeresHowYouKnowBannerSpanish = selectorResults.some((text) => text.includes("Así es como usted puede verificarlo"));
    const hasHeresHowYouKnowBanner = hasHeresHowYouKnowBannerEnglish || hasHeresHowYouKnowBannerSpanish;

    return {
      usaClassesCount,
      uniqueClasses,
      hasHeresHowYouKnowBannerEnglish,
      hasHeresHowYouKnowBannerSpanish,
      hasHeresHowYouKnowBanner,
    };
  });

  if (pageResults.hasHeresHowYouKnowBannerEnglish) {
    logCount(logger, {}, 'scanner.page.primary.scan.uswds.heresHowYouKnowBanner', 'Found English "Here\'s how you know" banner');
  };
  if (pageResults.hasHeresHowYouKnowBannerSpanish) {
    logCount(logger, {}, 'scanner.page.primary.scan.uswds.heresHowYouKnowBanner', 'Found Spanish "Here\'s how you know" banner');
  };
  if (!pageResults.hasHeresHowYouKnowBanner) {
    logCount(logger, {}, 'scanner.page.primary.scan.uswds.heresHowYouKnowBanner', '"Here\'s how you know" banner not found');
  };

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
};

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
