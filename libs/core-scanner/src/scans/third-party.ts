import { uniq } from 'lodash';
import { HTTPRequest, HTTPResponse } from 'puppeteer';
import { Logger } from 'pino';
import { logCount, logTimer } from '../metric-utils';

import { ThirdPartyScan } from 'entities/scan-data.entity';

export const buildThirdPartyResult = async (
  parentLogger: Logger,
  mainResponse: HTTPResponse,
  outboundRequests: HTTPRequest[],
): Promise<ThirdPartyScan> => {
  const logger = parentLogger.child({ scan: 'third-party-scan' });
  const timer = logTimer(logger);
  const url = mainResponse && mainResponse.url();
  const thirdPartyResult = await thirdPartyServices(logger, outboundRequests, url);
  const thirdPartyUrlResult = await thirdPartyServicesUrls(logger, outboundRequests, url);
  timer.log({}, 'scanner.page.primary.scan.third-party.duration.total', `Third-party scan completed in [{metricValue}ms]`);
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
  return {
    domains: deduped.join(','),
    count: deduped.length,
  };
};

/**
 * This function returns the third-party URLs
 * @param outboundRequests: HTTPRequest[]
 * @param finalUrl: string
 * @returns string
 */
export function thirdPartyServicesUrls ( parentLogger: Logger, outboundRequests: HTTPRequest[], finalUrl: string ): string{
  const logger = parentLogger.child({ function: 'thirdPartyServicesUrls' });
  const parsedUrl = new URL(finalUrl);
  const thirdPartyDomains = [];

  for (const request of outboundRequests) {
    const url = request && new URL(request.url());
    if (parsedUrl.hostname != url.hostname && !request.isNavigationRequest()) {
      const fullUrl = removeQueryParameters(url.toString());
      const isFileLoad = fullUrl.startsWith('http') || fullUrl.startsWith('https');
      if( isFileLoad) {
        thirdPartyDomains.push(fullUrl);
      }
    }
  }
  const deduped = uniq(thirdPartyDomains).filter(Boolean).sort();
  logCount(logger, { thirdPartyServicesUrlsCount: deduped.length }, 'scanner.page.primary.scan.third-party.unique_external_urls.count', 'Third-party services url count: {metricValue}');
  return deduped.join(',')
};

/**
 * This function removes the query parameters from the URL
 * @param url: string
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