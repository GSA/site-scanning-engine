import { Logger } from '@nestjs/common';
import { Page, HTTPRequest } from 'puppeteer';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { buildCoreResult } from '@app/core-scanner/scans/core';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';

import { getHttpsUrl } from './helpers';
import { buildDapResult } from '../scans/dap';
import { buildSeoResult } from '../scans/seo';
import { buildThirdPartyResult } from '../scans/third-party';
import { buildUswdsResult } from '../scans/uswds';

export const createHomePageScanner = (logger: Logger, input: CoreInputDto) => {
  return async (page) => {
    const [coreResults, solutionsResults] = await Promise.all([
      coreScan(logger, input, page),
      solutionsScan(logger, input, page),
    ]);
    return {
      coreResults,
      solutionsResults,
    };
  };
};

export const solutionsScan = async (
  logger: Logger,
  input: CoreInputDto,
  page: Page,
) => {
  const url = getHttpsUrl(input.url);

  logger.log({ msg: 'Processing main page...', ...input });
  // attach listeners
  const cssPages = [];
  page.on('response', async (response) => {
    if (response.request().resourceType() == 'stylesheet') {
      const cssPage = await response.text();
      cssPages.push(cssPage);
    }
  });

  const outboundRequests: HTTPRequest[] = [];
  page.on('request', (request) => {
    outboundRequests.push(request);
  });

  // goto url and wait until there are only 2 idle requests
  const response = await page.goto(url, {
    waitUntil: 'networkidle2',
  });

  // extract the html page source
  const htmlText = await response.text();

  const [coreResult, dapResult, thirdPartyResult, seoResult, uswdsResult] =
    await Promise.all([
      await buildResult(input.websiteId),
      await buildDapResult(outboundRequests),
      await buildThirdPartyResult(response, outboundRequests),
      await buildSeoResult(logger, input, page),
      await buildUswdsResult(logger, input, cssPages, htmlText, page),
    ]);

  return {
    ...coreResult,
    ...dapResult,
    ...seoResult,
    ...thirdPartyResult,
    ...uswdsResult,
  };
};

const buildResult = async (websiteId: number): Promise<SolutionsResult> => {
  const result = new SolutionsResult();
  const website = new Website();
  website.id = websiteId;
  result.website = website;
  return result;
};

export const coreScan = async (
  logger: Logger,
  input: CoreInputDto,
  page: Page,
) => {
  const url = getHttpsUrl(input.url);
  const logData = {
    ...input,
  };

  // load the url
  logger.debug({ msg: `loading ${url}`, ...logData });
  const response = await page.goto(url, {
    waitUntil: 'networkidle2',
  });

  // construct the CoreResult
  return buildCoreResult(input, page, response);
};
