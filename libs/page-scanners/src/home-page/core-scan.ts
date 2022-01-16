import { HttpService, HttpStatus, Logger } from '@nestjs/common';
import { Agent } from 'https';
import { join, split, takeRight } from 'lodash';
import { Page, Request, Response } from 'puppeteer';
import { v4 } from 'uuid';

import { parseBrowserError, ScanStatus } from '@app/core-scanner/scan-status';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { SolutionsInputDto } from '@app/solutions-scanner/solutions.input.dto';
import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';

import { getHttpsUrl, getMIMEType } from '../helpers';

export const coreScan = async (
  httpService: HttpService,
  logger: Logger,
  input: SolutionsInputDto,
  page: Page,
) => {
  const url = getHttpsUrl(input.url);
  const logData = {
    ...input,
  };

  // load the url
  logger.debug({ msg: `loading ${url}`, ...logData });
  const response = await page.goto(url, {
    waitUntil: 'networkidle2',
  });

  // do the redirect test
  const notFound = await notFoundTest(httpService, url);

  // construct the CoreResult
  return buildResult(input, notFound, page, response);
};

const buildResult = (
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

const notFoundTest = async (
  httpService: HttpService,
  url: string,
): Promise<boolean> => {
  const randomUrl = new URL(url);
  randomUrl.pathname = `not-found-test${v4()}`;

  const agent = new Agent({
    rejectUnauthorized: false,
  });

  const resp = await httpService
    .get(randomUrl.toString(), {
      validateStatus: (_) => {
        return true;
      },
      httpsAgent: agent,
    })
    .toPromise();

  return resp.status == HttpStatus.NOT_FOUND;
};

export const buildErrorResult = (input: CoreInputDto, err: Error) => {
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
