import { join, split, takeRight } from 'lodash';
import { Page, HTTPRequest, HTTPResponse } from 'puppeteer';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { ScanStatus } from '@app/core-scanner/scan-status';
import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';

import { getHttpsUrl, getMIMEType } from '../pages/helpers';
import { getBaseDomain } from '../test-helper';

export const buildCoreResult = (
  input: CoreInputDto,
  page: Page,
  response: HTTPResponse,
) => {
  const url = getHttpsUrl(input.url);

  const result = new CoreResult();
  const website = new Website();
  website.id = input.websiteId;

  const redirectChain = response.request().redirectChain();
  const finalUrl = getFinalUrl(page);

  result.website = website;
  result.targetUrlRedirects = redirects(redirectChain);
  result.targetUrlBaseDomain = getBaseDomain(url);
  result.finalUrl = finalUrl;
  result.finalUrlMIMEType = getMIMEType(response);
  result.finalUrlIsLive = isLive(response);
  result.finalUrlBaseDomain = getBaseDomain(finalUrl);
  result.finalUrlSameDomain = getBaseDomain(url) === getBaseDomain(finalUrl);
  result.finalUrlSameWebsite =
    getPathname(url) == getPathname(finalUrl) &&
    getBaseDomain(url) == getBaseDomain(finalUrl);
  result.finalUrlStatusCode = response.status();

  // TODO - avoid setting these all here
  result.notFoundScanStatus = ScanStatus.Completed;
  result.homeScanStatus = ScanStatus.Completed;
  result.robotsTxtScanStatus = ScanStatus.Completed;
  result.sitemapXmlScanStatus = ScanStatus.Completed;

  return result;
};

const redirects = (requests: HTTPRequest[]): boolean => {
  return requests.length > 0;
};

const getFinalUrl = (page: Page) => {
  const finalUrl = page.url();
  return finalUrl;
};

const getPathname = (url: string) => {
  const parsed = new URL(url);
  return parsed.pathname;
};

const isLive = (res: HTTPResponse) => {
  const isLive = res.status() / 100 === 2; // 2xx family
  return isLive;
};
