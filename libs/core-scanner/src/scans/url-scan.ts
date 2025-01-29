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
    targetUrlRedirects: isRedirect(url, getWithSubdomain(finalUrl), logger),
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

  // Remove trailing slashes
  url = url.replace(/\/$/, '');

  return url;
}

function removeWww(url: string): string {
  return url.replace(/^www\./, '');
}

/**
 * Compares the initial URL and final URL to determine if a redirect occurred
 * 
 * @param initialUrl The initial URL that is being scanned. Stored as the `url` property in the CoreInputDto
 * @param finalUrl The final URL after all redirects. Stored as the `name` property in the CoreResult
 * @param logger
 * @returns true if the initial URL and final URL are the same, false if they are different, and null if either is missing
 */
function isRedirect(initialUrl: string, finalUrl: string, logger: Logger): boolean {
  if (!finalUrl) {
    logger.info('No final URL found, cannot compare.');
    return null;
  }

  initialUrl = cleanUrl(initialUrl);
  finalUrl = removeWww(cleanUrl(finalUrl));

  if (initialUrl === finalUrl) {
    logger.info({redirectCheck: {initialUrl, finalUrl}}, 'Initial URL and final URL are the same.');
    return true;
  }
  if (initialUrl && finalUrl) {
    logger.info({redirectCheck: {initialUrl, finalUrl}}, 'Initial URL and final URL are different.');
    return false;
  }

  return null;
}
