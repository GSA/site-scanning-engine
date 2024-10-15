import { uniq } from 'lodash';
import { HTTPRequest, HTTPResponse } from 'puppeteer';
import { Logger } from 'pino';
import { logCount } from '../../../logging/src/metric-utils';

import { ThirdPartyScan } from 'entities/scan-data.entity';

export const buildThirdPartyResult = async (
  parentLogger: Logger,
  mainResponse: HTTPResponse,
  outboundRequests: HTTPRequest[],
): Promise<ThirdPartyScan> => {
  const logger = parentLogger.child({ scan: 'third-party-scan' });
  const url = mainResponse && mainResponse.url();
  const thirdPartyResult = await thirdPartyServices(logger, outboundRequests, url);
  const thirdPartyUrlResult = await thirdPartyServicesUrls(logger, outboundRequests, url);
  return {
    thirdPartyServiceDomains: thirdPartyResult.domains,
    thirdPartyServiceCount: thirdPartyResult.count,
    thirdPartyServiceUrls: thirdPartyUrlResult,
  };
};

export function thirdPartyServices ( parentLogger: Logger, outboundRequests: HTTPRequest[], finalUrl: string, ): { domains: string; count: number; } {
  const logger = parentLogger.child({ function: 'thirdPartyServices' });
  const parsedUrl = new URL(finalUrl);
  const thirdPartyDomains = [];

  for (const request of outboundRequests) {
    const url = request && new URL(request.url());
    if (parsedUrl.hostname != url.hostname && !request.isNavigationRequest()) {
      thirdPartyDomains.push(url.hostname);
    }
  }
  const deduped = uniq(thirdPartyDomains).filter(Boolean).sort();
  logCount( logger, { thirdPartyServicesDomainsCount: deduped.length }, `scanner.page.primary.scan.third-party.domainCount`, `${deduped.length} third party domains collected.`, deduped.length );
  return {
    domains: deduped.join(','),
    count: deduped.length,
  };
}

/**
 * This function returns the third-party URLs
 *
 * @param parentLogger
 * @param outboundRequests
 * @param finalUrl
 * @returns string
 */
export function thirdPartyServicesUrls ( parentLogger: Logger, outboundRequests: HTTPRequest[], finalUrl: string ): string {
  const logger = parentLogger.child({ function: 'thirdPartyServicesUrls' });
  const parsedUrl = new URL(finalUrl);
  const thirdPartyDomains = [];

  for (const request of outboundRequests) {
    const url = request && new URL(request.url());
    if (parsedUrl.hostname != url.hostname && !request.isNavigationRequest()) {
      const fullUrl = removeQueryParameters(url.toString());
      const isPageLoad = fullUrl.startsWith('http') || fullUrl.startsWith('https');
      if( isPageLoad) {
        thirdPartyDomains.push(fullUrl);
      }
    }
  }
  const deduped = uniq(thirdPartyDomains).filter(Boolean).sort();
  logCount(logger, { thirdPartyServicesUrlsCount: deduped.length }, 'scanner.page.primary.scan.third-party.unique_external_urls.count', `${deduped.length} unique external URLs collected.`, deduped.length);
  return deduped.join(',')
}

/**
 * This function removes the query parameters from the URL
 * @param url
 * @returns string
 */
export function removeQueryParameters(url: string): string {
  try {
      const parsedUrl = new URL(url);
      parsedUrl.search = '';

      return parsedUrl.toString();
  } catch (error) {
      throw new Error('Invalid URL');
  }
}