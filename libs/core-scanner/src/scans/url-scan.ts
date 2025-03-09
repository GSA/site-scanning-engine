import * as _ from 'lodash';
import { Page, HTTPRequest, HTTPResponse } from 'puppeteer';
import { Logger } from 'pino';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { UrlScan } from 'entities/scan-data.entity';
import { isLive, createRequestHandlers, getPageMd5Hash } from '../util';

import {
  getBaseDomain,
  getFullDomain,
  getHttpsUrl,
  getMIMEType,
  getWithSubdomain,
  getTopLevelDomain,
} from '../util';

export const buildUrlScanResult = async (
  input: CoreInputDto,
  page: Page,
  response: HTTPResponse,
  parentLogger: Logger,
): Promise<UrlScan> => {
  const logger = parentLogger.child({ sseContext: 'Scan.UrlScan', scan: 'URLScan'});
  logger.info('Building URL scan result...');
  createRequestHandlers(page, logger);
  const url = getHttpsUrl(input.url);
  const redirectChain = response ? response.request().redirectChain() : '';
  const finalUrl = getFinalUrl(page);
  const finalUrlPageHash = await getPageMd5Hash(page);
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
    finalUrlStatusCode: response ? response.status() : null,
    finalUrlPageHash: finalUrlPageHash,
  };
};

const redirects = (requests: HTTPRequest[]): boolean => {
  return requests.length > 0;
};

const getFinalUrl = (page: Page) => {
  const finalUrl = page.url();
  return finalUrl;
};

function removeWww(url: string): string {
  return url.replace(/^www\./, '');
}

function removeHttps(url: string): string {
  return url.replace(/^https?:\/\//, '');
}

/**
 * Compares the initial URL and final URL to determine if a redirect occurred
 * 
 * @param initialUrl The initial URL that is being scanned. Stored as the `url` property in the CoreInputDto
 * @param finalUrl The final URL after all redirects. Stored as the `name` property in the CoreResult after removing www.
 * @param logger
 * @returns true if the initial URL and final URL are the same, false if they are different, and null if either is missing
 */
function isRedirect(initialUrl: string, finalUrl: string, logger: Logger): boolean {
  if (!finalUrl) {
    logger.info('No final URL found, cannot compare.');
    return null;
  }

  initialUrl = removeHttps(initialUrl);
  finalUrl = removeWww(finalUrl);

  if (initialUrl === finalUrl) {
    logger.info({redirectCheck: {initialUrl, finalUrl}}, 'Initial URL and final URL are the same.');
    return false;
  }
  if (initialUrl && finalUrl) {
    logger.info({redirectCheck: {initialUrl, finalUrl}}, 'Initial URL and final URL are different.');
    return true;
  }

  return null;
}
