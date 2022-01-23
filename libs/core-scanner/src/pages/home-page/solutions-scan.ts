import { Logger } from '@nestjs/common';
import { Page, Request } from 'puppeteer';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';

import { getHttpsUrl } from '../helpers';
import { buildDapResult } from '../../scans/dap';
import { buildUswdsResult } from '../../scans/uswds';
import { buildThirdPartyResult } from '../../scans/third-party';

export const solutionsScan = async (
  logger: Logger,
  input: CoreInputDto,
  page: Page,
) => {
  const url = getHttpsUrl(input.url);

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

  const [coreResult, uswdsResult, dapResult, thirdPartyResult] =
    await Promise.all([
      await buildResult(input.websiteId),
      await buildUswdsResult(logger, input, cssPages, htmlText, page),
      await buildDapResult(outboundRequests),
      await buildThirdPartyResult(response, outboundRequests),
    ]);

  return {
    ...dapResult,
    ...uswdsResult,
    ...coreResult,
    ...thirdPartyResult,
  };
};

const buildResult = async (websiteId: number): Promise<SolutionsResult> => {
  const result = new SolutionsResult();
  const website = new Website();
  website.id = websiteId;
  result.website = website;
  return result;
};
