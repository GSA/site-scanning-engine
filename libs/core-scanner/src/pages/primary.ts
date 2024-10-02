import { Logger } from 'pino';
import { Page } from 'puppeteer';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { buildUrlScanResult } from '@app/core-scanner/scans/url-scan';
import { PrimaryScans } from 'entities/scan-page.entity';

import { buildDapResult } from '../scans/dap';
import { buildSeoResult } from '../scans/seo';
import { buildThirdPartyResult } from '../scans/third-party';
import { createUswdsScanner } from '../scans/uswds';
import { buildLoginResult } from '../scans/login';
import { promiseAll, getHttpsUrl } from '../util';
import { buildCmsResult } from '../scans/cms';
import {
  createCSSRequestsExtractor,
  createOutboundRequestsExtractor,
} from './extractors';
import { buildRequiredLinksResult } from '../scans/required-links';
import { buildCookieResult } from '../scans/cookies';
import { buildSearchResult } from '../scans/search';
import { buildMobileResult } from '../scans/mobile';

import { logCount, logTimer } from '../metric-utils';

export const createPrimaryScanner = (logger: Logger, input: CoreInputDto) => {
  return async (page) => {
    return await primaryScan(logger, input, page);
  };
};

type AsyncFunction<T> = (...args: any[]) => Promise<T>;

const primaryScan = async (
  parentLogger: Logger,
  input: CoreInputDto,
  page: Page,
): Promise<PrimaryScans> => {
  const url = getHttpsUrl(input.url);

  const logger = parentLogger.child({ scanUrl: url });
  logger.info('Processing main page...');
  logger.info(`Starting scan for ${url}`);

  const getCSSRequests = await createCSSRequestsExtractor(page, logger);
  const getOutboundRequests = createOutboundRequestsExtractor(page);

  const response = await page.goto(url, {
    waitUntil: 'networkidle0',
  });

  const wrappedDapResult = runScan(logger, buildDapResult, 'DAPScan', url);
  const wrappedThirdPartyResult = runScan(logger, buildThirdPartyResult, 'ThirdPartyScan', url);
  const wrappedCookieResult = runScan(logger, buildCookieResult, 'CookieScan', url);
  const wrappedSeoResult = runScan(logger, buildSeoResult, 'SEOScan', url);
  const wrappedUswdsScanner = runScan(logger, createUswdsScanner({ logger, getCSSRequests }, page), 'USWDSScan', url);
  const wrappedLoginResult = runScan(logger, buildLoginResult, 'LoginScan', url);
  const wrappedCmsResult = runScan(logger, buildCmsResult, 'CMSScan', url);
  const wrappedRequiredLinksResult = runScan(logger, buildRequiredLinksResult, 'Required LinksScan', url);
  const wrappedSearchResult = runScan(logger, buildSearchResult, 'SearchScan', url);
  const wrappedMobileResult = runScan(logger, buildMobileResult, 'MobileScan', url);

  const [
    dapScan,
    thirdPartyScan,
    cookieScan,
    seoScan,
    uswdsScan,
    loginScan,
    cmsScan,
    requiredLinksScan,
    searchScan,
    mobileScan,
  ] = await promiseAll([
    wrappedDapResult(logger, getOutboundRequests()),
    wrappedThirdPartyResult(logger, response, getOutboundRequests()),
    wrappedCookieResult(page),
    wrappedSeoResult(logger, page, response),
    wrappedUswdsScanner(response),
    wrappedLoginResult(response),
    wrappedCmsResult(response),
    wrappedRequiredLinksResult(page),
    wrappedSearchResult(page),
    wrappedMobileResult(logger, page),
  ]);
  const urlScan = buildUrlScanResult(input, page, response);

  return {
    urlScan,
    dapScan,
    seoScan,
    thirdPartyScan,
    cookieScan,
    uswdsScan,
    loginScan,
    cmsScan,
    requiredLinksScan,
    searchScan,
    mobileScan,
  };

  function runScan<T>(parentLogger: Logger, fn: AsyncFunction<T>, scanName: string, siteUrl: string): AsyncFunction<T> {
    return async (...args: any[]): Promise<T> => {
      const logger = parentLogger.child({ scan: scanName });
      logger.info(`Starting ${scanName}`);
      const timer = logTimer(logger);

      try {
        const toReturn = await fn(...args);
        timer.log({}, `scanner.page.primary.scan.${scanName}.duration.total`, `${scanName} completed in [{metricValue}ms]`);
        logCount( logger, {}, `${scanName}.succeeded.count`, `${scanName} completed successfully for site '${siteUrl}'.` );
        return toReturn;
      } catch (error) {
        logger.error({ error }, `${scanName} failed with error: ${error.message}`);
        logCount( logger, {}, `${scanName}.failed.count`, `${scanName} failed for site '${siteUrl}'.` );
        return null;
      }
    };
  };

};
