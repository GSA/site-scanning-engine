import { Logger } from 'pino';
import { Page } from 'puppeteer';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { buildCoreResult } from '@app/core-scanner/scans/core';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';

import { buildDapResult } from '../scans/dap';
import { buildSeoResult } from '../scans/seo';
import { buildThirdPartyResult } from '../scans/third-party';
import { createUswdsScanner } from '../scans/uswds';

import {
  createCSSRequestsExtractor,
  createOutboundRequestsExtractor,
} from './extractors';
import { getHttpsUrl } from './helpers';

export const createHomePageScanner = (logger: Logger, input: CoreInputDto) => {
  return async (page) => {
    return await homePageScan(logger, input, page);
  };
};

const homePageScan = async (
  logger: Logger,
  input: CoreInputDto,
  page: Page,
) => {
  const url = getHttpsUrl(input.url);

  logger.info('Processing main page...');

  const getCSSRequests = createCSSRequestsExtractor(page);
  const getOutboundRequests = createOutboundRequestsExtractor(page);

  // goto url and wait until there are only 2 idle requests
  const response = await page.goto(url, {
    waitUntil: 'networkidle2',
  });

  const [dapResult, thirdPartyResult, seoResult, uswdsResult] =
    await Promise.all([
      await buildDapResult(getOutboundRequests()),
      await buildThirdPartyResult(response, getOutboundRequests()),
      await buildSeoResult(logger, page),
      await createUswdsScanner({ logger, getCSSRequests }, page)(response),
    ]);
  const coreResult = buildCoreResult(input, page, response);

  return {
    coreResult,
    solutionsResult: {
      ...buildResultObject(input.websiteId),
      ...dapResult,
      ...seoResult,
      ...thirdPartyResult,
      ...uswdsResult,
    },
  };
};

const buildResultObject = (websiteId: number): SolutionsResult => {
  const result = new SolutionsResult();
  const website = new Website();
  website.id = websiteId;
  result.website = website;
  return result;
};
