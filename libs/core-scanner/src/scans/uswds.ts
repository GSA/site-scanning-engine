import { Logger } from '@nestjs/common';
import { sum, uniq } from 'lodash';
import { Page } from 'puppeteer';

import { ScanStatus } from '@app/core-scanner/scan-status';

export const buildUswdsResult = async (
  logger: Logger,
  logData: any,
  cssPages: string[],
  htmlText: string,
  page: Page,
) => {
  const uswdsSemanticVersion = uswdsSemVer(logger, logData, cssPages);
  const result = {
    status: ScanStatus.Completed,
    usaClasses: await usaClassesCount(page),
    uswdsString: uswdsInHtml(logger, logData, htmlText),
    uswdsTables: tableCount(htmlText),
    uswdsInlineCss: inlineUsaCssCount(htmlText),
    uswdsUsFlag: uswdsFlagDetected(htmlText),
    uswdsUsFlagInCss: uswdsFlagInCSS(cssPages),
    uswdsStringInCss: uswdsInCss(cssPages),
    uswdsMerriweatherFont: uswdsMerriweatherFont(cssPages),
    uswdsPublicSansFont: uswdsPublicSansFont(cssPages),
    uswdsSourceSansFont: uswdsSourceSansFont(cssPages),
    uswdsSemanticVersion,
    uswdsVersion: uswdsSemanticVersion ? 20 : 0,
    uswdsCount: 0,
  };
  result.uswdsCount = sum([
    result.usaClasses,
    result.uswdsString,
    result.uswdsTables,
    result.uswdsInlineCss,
    result.uswdsUsFlag,
    result.uswdsUsFlagInCss,
    result.uswdsStringInCss,
    result.uswdsMerriweatherFont,
    result.uswdsSourceSansFont,
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

const uswdsInHtml = (logger: Logger, logData: any, htmlText: string) => {
  const re = /uswds/g;
  const occurrenceCount = [...htmlText.matchAll(re)].length;
  logger.debug({
    msg: `uswds occurs ${occurrenceCount} times`,
    ...logData,
  });
  return occurrenceCount;
};

/**
 * tableCount detects the presence of <table> elements in HTML. This is a negative indicator of USWDS.
 *
 * @param htmlText html in text.
 */
const tableCount = (htmlText: string) => {
  const re = /<table/g;
  const occurrenceCount = [...htmlText.matchAll(re)].length;
  let deduction = 0;

  if (occurrenceCount > 0) {
    const tableDeduction = -10;
    deduction = tableDeduction * occurrenceCount;
  }

  return deduction;
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

const uswdsMerriweatherFont = (cssPages: string[]) => {
  const re = /[Mm]erriweather/;
  let score = 0;

  for (const page of cssPages) {
    const match = page.match(re);
    if (match) {
      score = 5;
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
      score = 20;
      break;
    }
  }

  return score;
};

const uswdsSourceSansFont = (cssPages: string[]) => {
  const re = /[Ss]ource.[Ss]ans.[Pp]ro/;
  let score = 0;

  for (const page of cssPages) {
    const match = page.match(re);
    if (match) {
      score = 5;
      break;
    }
  }

  return score;
};

const uswdsSemVer = (
  logger: Logger,
  logData: any,
  cssPages: string[],
): string | null => {
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
      logger.debug({
        msg: `found multiple USWDS versions ${uniqueVersions}`,
        ...logData,
      });
    }
    return uniqueVersions[0];
  } else {
    return null;
  }
};
