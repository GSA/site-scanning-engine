import * as _ from 'lodash';
import { Page, HTTPRequest, HTTPResponse } from 'puppeteer';
import { Logger } from 'pino';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { UrlScan } from 'entities/scan-data.entity';
import { isLive, createRequestHandlers, getPageMd5Hash } from '../util';
import { logCount } from '../../../logging/src/metric-utils';

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
  const logger = parentLogger.child({
    sseContext: 'Scan.UrlScan',
    scan: 'URLScan',
  });
  logger.info('Building URL scan result...');
  logger.debug(`Page url: ${page.url()}`);
  if (page.url() === 'chrome-error://chromewebdata/') {
    logger.warn('Page url is chrome-error://chromewebdata/');
    return {
      targetUrlRedirects: null,
      finalUrl: null,
      finalUrlWebsite: null,
      finalUrlTopLevelDomain: null,
      finalUrlMIMEType: null,
      finalUrlIsLive: false,
      finalUrlBaseDomain: null,
      finalUrlSameDomain: null,
      finalUrlSameWebsite: null,
      finalUrlStatusCode: response ? response.status() : null,
      finalUrlPageHash: null,
    };
  }
  createRequestHandlers(page, logger);
  const url = getHttpsUrl(input.url);
  const redirectChain = response ? response.request().redirectChain() : '';
  const finalUrl = getFinalUrl(page);
  logUrlResponseDivergence(logger, finalUrl, response?.url());
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

export const URL_RESPONSE_DIVERGENCE_METRIC_ID =
  'scanner.url_scan.page_response_url_divergence.count';

export const URL_RESPONSE_DIVERGENCE_MESSAGE =
  'Scanned page URL differs from the navigation response URL; URL and response metadata may describe different documents.';

/**
 * Emits a count metric when the rendered page URL differs from the
 * navigation response URL. The URL fields of a scan come from the current page,
 * but status code, media type, and liveness come from the response, so a
 * divergence means one result row may describe two documents (e.g. after a
 * client-side redirect).
 *
 * @param logger
 * @param pageUrl The current page URL from `page.url()`.
 * @param responseUrl The navigation response URL, if there was a response.
 */
export function logUrlResponseDivergence(
  logger: Logger,
  pageUrl: string,
  responseUrl?: string,
): void {
  if (!pageUrl || !responseUrl) {
    return;
  }
  if (pageUrl === responseUrl) {
    return;
  }

  logCount(
    logger,
    { pageUrl, responseUrl },
    URL_RESPONSE_DIVERGENCE_METRIC_ID,
    URL_RESPONSE_DIVERGENCE_MESSAGE,
  );
}

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
function isRedirect(
  initialUrl: string,
  finalUrl: string,
  logger: Logger,
): boolean {
  if (!finalUrl) {
    logger.info('No final URL found, cannot compare.');
    return null;
  }

  initialUrl = removeHttps(initialUrl);
  finalUrl = removeWww(finalUrl);

  if (initialUrl === finalUrl) {
    logger.info(
      { redirectCheck: { initialUrl, finalUrl } },
      'Initial URL and final URL are the same.',
    );
    return false;
  }
  if (initialUrl && finalUrl) {
    logger.info(
      { redirectCheck: { initialUrl, finalUrl } },
      'Initial URL and final URL are different.',
    );
    return true;
  }

  return null;
}
