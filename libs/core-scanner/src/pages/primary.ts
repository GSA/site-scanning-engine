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

import { logCount, logTimer } from '../../../logging/src/metric-utils';

import { createRequestHandlers } from '../util';

export const createPrimaryScanner = (logger: Logger, input: CoreInputDto) => {
  return async (page) => {
    return await primaryScan(logger, input, page);
  };
};

type AsyncFunction<T> = (...args: any[]) => Promise<T>;

const primaryScan = async (
  pageLogger: Logger,
  input: CoreInputDto,
  page: Page,
): Promise<PrimaryScans> => {
  createRequestHandlers(page, pageLogger);
  const url = getHttpsUrl(input.url);
  const getCSSRequests = await createCSSRequestsExtractor(page, pageLogger);
  const getOutboundRequests = createOutboundRequestsExtractor(page);
  let response = null;
  try {
    response = await page.goto(url, {
      waitUntil: 'networkidle0',
    });
  } catch (error) {
    pageLogger.error({error}, `Failed to navigate to ${url} because of error: ${error.message}`);
    return null;
  }

  const wrappedDapResult = runScan(input, pageLogger, buildDapResult, 'DAPScan', url);
  const wrappedThirdPartyResult = runScan(input, pageLogger, buildThirdPartyResult, 'ThirdPartyScan', url);
  const wrappedCookieResult = runScan(input, pageLogger, buildCookieResult, 'CookieScan', url);
  const wrappedSeoResult = runScan(input, pageLogger, buildSeoResult, 'SEOScan', url);
  const wrappedUswdsScanner = runScan(input, pageLogger, createUswdsScanner(getCSSRequests, page), 'USWDSScan', url);
  const wrappedLoginResult = runScan(input, pageLogger, buildLoginResult, 'LoginScan', url);
  const wrappedCmsResult = runScan(input, pageLogger, buildCmsResult, 'CMSScan', url);
  const wrappedRequiredLinksResult = runScan(input, pageLogger, buildRequiredLinksResult, 'Required LinksScan', url);
  const wrappedSearchResult = runScan(input, pageLogger, buildSearchResult, 'SearchScan', url);
  const wrappedMobileResult = runScan(input, pageLogger, buildMobileResult, 'MobileScan', url);

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
    wrappedDapResult(getOutboundRequests()),
    wrappedThirdPartyResult(response, getOutboundRequests()),
    wrappedCookieResult(page),
    wrappedSeoResult(page, response),
    wrappedUswdsScanner(response),
    wrappedLoginResult(response),
    wrappedCmsResult(response),
    wrappedRequiredLinksResult(page),
    wrappedSearchResult(page),
    wrappedMobileResult(page),
  ]);
  const urlScan = buildUrlScanResult(input, page, response, pageLogger);

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

  function runScan<T>(input: CoreInputDto, parentLogger: Logger, fn: AsyncFunction<T>, scanName: string, siteUrl: string): AsyncFunction<T> {
    return async (...args: any[]): Promise<T> => {
      const stepLogger = parentLogger.child({
        sseContext: `Scan.${scanName}`,
        scan: scanName
      });

      if(!shouldRunScan(scanName, input, stepLogger)) {
        stepLogger.debug(`Skipping ${scanName}`);
        return "skipped" as T;
      }

      stepLogger.info(`Starting ${scanName}`);
      const timer = logTimer(stepLogger);

      try {
        const toReturn = await fn(stepLogger, ...args);
        timer.log({}, `scanner.page.primary.scan.${scanName}.duration.total`, `${scanName} completed for site '${siteUrl}' in [{metricValue}ms]`);
        logCount(stepLogger, {}, `${scanName}.succeeded.count`, `${scanName} completed successfully for site '${siteUrl}'.`);
        return toReturn;
      } catch (error) {
        stepLogger.error({error}, `${scanName} failed with error: ${error.message}`);
        logCount(stepLogger, {}, `${scanName}.failed.count`, `${scanName} failed for site '${siteUrl}'.`);
        return null;
      }
    };
  }

  function shouldRunScan(scanName: string, input: CoreInputDto, pageLogger: Logger): boolean {
    if (!input.scan) {
      return true;
    }
    if (scanName.toLowerCase().includes(input.scan.toLowerCase())) {
      pageLogger.info(`Scan '${scanName}' includes scan filter '${input.scan}'; running scan.`);
      return true;
    }
    pageLogger.warn(`Scan '${scanName}' does not include scan filter '${input.scan}'; skipping scan.`);
  }


};
