import { sum, uniq } from 'lodash';
import { Logger } from 'pino';
import { Page, HTTPResponse } from 'puppeteer';

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
  logger: Logger,
  cssPages: string[],
  htmlText: string,
  page: Page,
): Promise<UswdsScan> => {
  const uswdsSemanticVersion = uswdsSemVer(logger, cssPages);
  const uswdsVersionScoreAdjustment = 100;
  const result = {
    usaClasses: await usaClassesCount(page),
    uswdsString: uswdsInHtml(logger, htmlText),
    uswdsInlineCss: inlineUsaCssCount(htmlText),
    uswdsUsFlag: uswdsFlagDetected(htmlText),
    uswdsUsFlagInCss: uswdsFlagInCSS(cssPages),
    uswdsStringInCss: uswdsInCss(cssPages),
    uswdsPublicSansFont: uswdsPublicSansFont(cssPages),
    uswdsSemanticVersion,
    uswdsVersion: uswdsSemanticVersion ? uswdsVersionScoreAdjustment : 0,
    uswdsCount: 0,
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

const usaClassesCount = async (page: Page) => {
  const usaClassesCount = await page.evaluate(() => {
    const usaClasses = [...document.querySelectorAll("[class^='usa-']")];

    let score = 0;

    if (usaClasses.length > 0) {
      score = Math.round(Math.sqrt(usaClasses.length)) * 5;
    }

    return score;
  });

  return usaClassesCount;
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
  // these are the asset names of the small us flag in the USA Header for different uswds versions and devices.
  const re =
    /us_flag_small.png|favicon-57.png|favicon-192.png|favicon-72.png|favicon-144.png|favicon-114.png/;

  // all we need is one match to give the points;
  const occurrenceCount = htmlText.match(re);
  let score = 0;

  if (occurrenceCount) {
    score = 20;
  }
  return score;
};

const uswdsInCss = (cssPages: string[]) => {
  let score = 0;
  const re = /uswds/i;

  for (const page of cssPages) {
    const match = page.match(re);
    if (match) {
      score = 20;
      break;
    }
  }

  return score;
};

const uswdsFlagInCSS = (cssPages: string[]) => {
  // these are the asset names of the small us flag in the USA Header for differnt uswds versions and devices.
  const re =
    /us_flag_small.png|favicon-57.png|favicon-192.png|favicon-72.png|favicon-144.png|favicon-114.png/;
  let score = 0;

  for (const page of cssPages) {
    const match = page.match(re);
    if (match) {
      score = 20;
      break;
    }
  }

  return score;
};

const uswdsPublicSansFont = (cssPages: string[]) => {
  const re = /[Pp]ublic.[Ss]ans/;
  let score = 0;

  for (const page of cssPages) {
    const match = page.match(re);
    if (match) {
      score = 40;
      break;
    }
  }

  return score;
};

const uswdsSemVer = (logger: Logger, cssPages: string[]): string | null => {
  const re = /uswds v?[0-9.]*/i;

  const versions: string[] = [];

  for (const page of cssPages) {
    const match = page.match(re);

    if (match) {
      const version = match[0].split(' ')[1];
      versions.push(version);
    }
  }

  if (versions) {
    const uniqueVersions = uniq(versions);
    if (uniqueVersions.length > 1) {
      logger.debug(`found multiple USWDS versions ${uniqueVersions}`);
    }
    return uniqueVersions[0];
  } else {
    return null;
  }
};
