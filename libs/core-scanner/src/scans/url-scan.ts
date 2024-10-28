import * as _ from 'lodash';
import { Page, HTTPRequest, HTTPResponse } from 'puppeteer';
import { Logger } from 'pino';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { UrlScan } from 'entities/scan-data.entity';
import { isLive, createRequestHandlers } from '../util';

import {
  getBaseDomain,
  getFullDomain,
  getHttpsUrl,
  getMIMEType,
  getWithSubdomain,
  getTopLevelDomain,
} from '../util';

export const buildUrlScanResult = (
  input: CoreInputDto,
  page: Page,
  response: HTTPResponse,
  parentLogger: Logger,
): UrlScan => {
  const logger = parentLogger.child({ sseContext: 'Scan.UrlScan', scan: 'URLScan'});
  logger.info('Building URL scan result...');
  createRequestHandlers(page, logger);
  const url = getHttpsUrl(input.url);
  const redirectChain = response.request().redirectChain();
  const finalUrl = getFinalUrl(page);
  return {
    targetUrlRedirects: redirects(redirectChain),
    finalUrl: finalUrl,
    finalUrlWebsite: getWithSubdomain(finalUrl),
    finalUrlTopLevelDomain: getTopLevelDomain(finalUrl),
    finalUrlMIMEType: getMIMEType(response),
    finalUrlIsLive: isLive(response),
    finalUrlBaseDomain: getBaseDomain(finalUrl),
    finalUrlSameDomain: getBaseDomain(url) === getBaseDomain(finalUrl),
    finalUrlSameWebsite: getFullDomain(url) === getFullDomain(finalUrl),
    finalUrlStatusCode: response.status(),
  };
};

const redirects = (requests: HTTPRequest[]): boolean => {
  return requests.length > 0;
};

const getFinalUrl = (page: Page) => {
  const finalUrl = page.url();
  return finalUrl;
};
