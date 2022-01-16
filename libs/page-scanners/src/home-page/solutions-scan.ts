import { Logger } from '@nestjs/common';
import { sum, uniq } from 'lodash';
import { Page, Request, Response } from 'puppeteer';

import { ScanStatus } from '@app/core-scanner/scan-status';
import { SolutionsInputDto } from '@app/solutions-scanner/solutions.input.dto';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';

import { getHttpsUrl } from '../helpers';

export const solutionsScan = async (
  logger: Logger,
  input: SolutionsInputDto,
  page: Page,
) => {
  const url = getHttpsUrl(input.url);
  const logData = {
    ...input,
  };

  logger.log('Processing main page...');
  // attach listeners
  const cssPages = [];
  page.on('response', async (response) => {
    if (response.request().resourceType() == 'stylesheet') {
      const cssPage = await response.text();
      cssPages.push(cssPage);
    }
  });

  const outboundRequests: Request[] = [];
  page.on('request', (request) => {
    outboundRequests.push(request);
  });

  // goto url and wait until there are only 2 idle requests
  const response = await page.goto(url, {
    waitUntil: 'networkidle2',
  });

  // extract the html page source
  const htmlText = await response.text();

  // build the result
  return await buildResult(
    logger,
    logData,
    response,
    input.websiteId,
    cssPages,
    htmlText,
    page,
    outboundRequests,
  );
};

const buildResult = async (
  logger: Logger,
  logData: any,
  mainResponse: Response,
  websiteId: number,
  cssPages: string[],
  htmlText: string,
  page: Page,
  outboundRequests: Request[],
): Promise<SolutionsResult> => {
  const result = new SolutionsResult();
  const website = new Website();
  website.id = websiteId;
  result.website = website;

  result.status = ScanStatus.Completed;
  result.usaClasses = await usaClassesCount(page);
  result.uswdsString = uswdsInHtml(logger, logData, htmlText);
  result.uswdsTables = tableCount(htmlText);
  result.uswdsInlineCss = inlineUsaCssCount(htmlText);
  result.uswdsUsFlag = uswdsFlagDetected(htmlText);
  result.uswdsUsFlagInCss = uswdsFlagInCSS(cssPages);
  result.uswdsStringInCss = uswdsInCss(cssPages);
  result.uswdsMerriweatherFont = uswdsMerriweatherFont(cssPages);
  result.uswdsPublicSansFont = uswdsPublicSansFont(cssPages);
  result.uswdsSourceSansFont = uswdsSourceSansFont(cssPages);
  result.uswdsSemanticVersion = uswdsSemVer(logger, logData, cssPages);
  result.uswdsVersion = result.uswdsSemanticVersion ? 20 : 0;
  result.uswdsCount = uswdsCount(result);

  // dap
  result.dapDetected = dapDetected(outboundRequests);
  result.dapParameters = dapParameters(outboundRequests);

  // seo
  result.ogTitleFinalUrl = await findOpenGraphTag(page, 'og:title');
  result.ogDescriptionFinalUrl = await findOpenGraphTag(page, 'og:description');
  result.ogArticlePublishedFinalUrl = await findOpenGraphDates(
    logger,
    logData,
    page,
    'article:published_date',
  );
  result.ogArticleModifiedFinalUrl = await findOpenGraphDates(
    logger,
    logData,
    page,
    'article:modified_date',
  );

  result.mainElementFinalUrl = await findMainElement(page);

  // third party services
  const thirdPartyResult = thirdPartyServices(
    outboundRequests,
    mainResponse.url(),
  );
  result.thirdPartyServiceDomains = thirdPartyResult.domains;
  result.thirdPartyServiceCount = thirdPartyResult.count;

  return result;
};

const uswdsCount = (result: SolutionsResult) => {
  const uswdsCount = sum([
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
  return uswdsCount;
};

const thirdPartyServices = (
  outboundRequests: Request[],
  finalUrl: string,
): ThirdPartyServicesResult => {
  const parsedUrl = new URL(finalUrl);
  const thirdPartyDomains = [];

  for (const request of outboundRequests) {
    const url = new URL(request.url());
    if (parsedUrl.hostname != url.hostname && !request.isNavigationRequest()) {
      thirdPartyDomains.push(url.hostname);
    }
  }
  const deduped = uniq(thirdPartyDomains).filter(Boolean);
  return {
    domains: deduped.join(','),
    count: deduped.length,
  };
};

interface ThirdPartyServicesResult {
  domains: string;
  count: number;
}

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

/**
 * dapDetected looks to see if the Digital Analytics Program is detected on a page.
 *
 * It works by looking for the Google Analytics UA Identifier in either the URL or Post Data.
 * @param outboundRequests
 */
const dapDetected = (outboundRequests: Request[]) => {
  const dapUaId = 'UA-33523145-1';
  let detected = false;

  for (const request of outboundRequests) {
    if (request.url().includes(dapUaId)) {
      detected = true;
      break;
    }

    try {
      if (request.postData().includes(dapUaId)) {
        detected = true;
        break;
      }
    } catch (error) {
      // fine to ignore if there's no post body.
    }
  }

  return detected;
};

const dapParameters = (outboundRequests: Request[]) => {
  const dapUrl = 'dap.digitalgov.gov/Universal-Federated-Analytics-Min.js';

  let parameters: string;
  for (const request of outboundRequests) {
    const requestUrl = request.url();

    if (requestUrl.includes(dapUrl)) {
      const parsedUrl = new URL(requestUrl);
      parameters = parsedUrl.searchParams.toString();
      break;
    }
  }

  return parameters;
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
  logData: any,
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
      logger.warn({
        msg: `Could not parse date ${targetDate}: ${err.message}`,
        ...logData,
      });
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
