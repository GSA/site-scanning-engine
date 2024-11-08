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
  logger.info(`Building third party scan result for: ${mainResponse.url()}`);
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
  logger.info(`Collecting third party services for: ${finalUrl}`);
  try {
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
  } catch (error) {
    logger.error({ error }, `Error collecting third party services: ${error.message}`);
    return {
      domains: '',
      count: 0,
    };
  }
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
  logger.info(`Collecting third party services URLs for: ${finalUrl}`);
  try{
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
  } catch (error) {
    logger.error({ error }, `Error collecting third party services URLs: ${error.message}`);
    return '';
  }
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