import { join, split, takeRight } from 'lodash';
import { Page, Request, Response } from 'puppeteer';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { parseBrowserError, ScanStatus } from '@app/core-scanner/scan-status';
import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';

import { getHttpsUrl, getMIMEType } from '../helpers';

export const buildCoreResult = (
  input: CoreInputDto,
  notFoundTest: boolean,
  page: Page,
  response: Response,
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
  result.status = ScanStatus.Completed;
  result.targetUrl404Test = notFoundTest;

  return result;
};

export const buildCoreErrorResult = (input: CoreInputDto, err: Error) => {
  const url = getHttpsUrl(input.url);
  const errorType = parseBrowserError(err);

  const website = new Website();
  website.id = input.websiteId;

  const result = new CoreResult();
  result.website = website;
  result.targetUrlBaseDomain = getBaseDomain(url);
  result.status = errorType;

  return result;
};

// 18f.gsa.gov -> gsa.gov
const getBaseDomain = (url: string) => {
  const parsedUrl = new URL(url);
  const baseDomain = takeRight(split(parsedUrl.hostname, '.'), 2);
  return join(baseDomain, '.');
};

const redirects = (requests: Request[]): boolean => {
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

const isLive = (res: Response) => {
  const isLive = res.status() / 100 === 2; // 2xx family
  return isLive;
};
