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
    targetUrlRedirects: isRedirect(url, finalUrl, logger),
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

function cleanUrl(url: string): string {
  // Remove the protocol (http:// or https://)
  url = url.replace(/^https?:\/\//, '');
  
  // Remove 'www.' if it exists
  url = url.replace(/^www\./, '');

  // Remove trailing slashes
  url = url.replace(/\/$/, '');

  return url;
}

function isRedirect(initialUrl: string, finalUrl: string, logger: Logger): boolean {
  if (!initialUrl || !finalUrl) {
    logger.warn('One of the URLs is missing, cannot determine redirection.');
    return null;
  }
  initialUrl = cleanUrl(initialUrl);
  finalUrl = cleanUrl(finalUrl);
  logger.info({redirectCheck: {initialUrl, finalUrl}}, `Comparing initial URL: ${initialUrl} with final URL: ${finalUrl}`);
  logger.info(`Redirect check is: ${initialUrl !== finalUrl}`);
  return initialUrl !== finalUrl;
}
