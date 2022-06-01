import * as _ from 'lodash';
import { Logger } from 'pino';
import { Page } from 'puppeteer';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { buildUrlScanResult } from '@app/core-scanner/scans/url-scan';
import { PrimaryScans } from 'entities/scan-page.entity';

import { buildDapResult } from '../scans/dap';
import { buildSeoResult } from '../scans/seo';
import { buildThirdPartyResult } from '../scans/third-party';
import { createUswdsScanner } from '../scans/uswds';
import { promiseAll } from '../util';

import {
  createCSSRequestsExtractor,
  createOutboundRequestsExtractor,
} from './extractors';
import { getHttpsUrl } from './helpers';

export const createPrimaryScanner = (logger: Logger, input: CoreInputDto) => {
  return async (page) => {
    return await primaryScan(logger, input, page);
  };
};

const primaryScan = async (
  logger: Logger,
  input: CoreInputDto,
  page: Page,
): Promise<PrimaryScans> => {
  const url = getHttpsUrl(input.url);

  logger.info('Processing main page...');

  const getCSSRequests = createCSSRequestsExtractor(page);
  const getOutboundRequests = createOutboundRequestsExtractor(page);

  // goto url and wait until there are only 2 idle requests
  const response = await page.goto(url, {
    waitUntil: 'networkidle2',
  });

  const [dapScan, thirdPartyScan, seoScan, uswdsScan] = await promiseAll([
    buildDapResult(getOutboundRequests()),
    buildThirdPartyResult(response, getOutboundRequests()),
    buildSeoResult(logger, page),
    createUswdsScanner({ logger, getCSSRequests }, page)(response),
  ]);
  const urlScan = buildUrlScanResult(input, page, response);

  return {
    urlScan,
    dapScan,
    seoScan,
    thirdPartyScan,
    uswdsScan,
  };
};
