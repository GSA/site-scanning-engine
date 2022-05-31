import { Page, HTTPRequest, HTTPResponse } from 'puppeteer';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { UrlScan } from 'entities/scan-data.entity';

import {
  getBaseDomain,
  getFullDomain,
  getHttpsUrl,
  getMIMEType,
} from '../util';

export const buildUrlScanResult = (
  input: CoreInputDto,
  page: Page,
  response: HTTPResponse,
): UrlScan => {
  const url = getHttpsUrl(input.url);
  const redirectChain = response.request().redirectChain();
  const finalUrl = getFinalUrl(page);
  return {
    targetUrlRedirects: redirects(redirectChain),
    finalUrl: finalUrl,
    finalUrlMIMEType: getMIMEType(response),
    finalUrlIsLive: isLive(response),
    finalUrlBaseDomain: getBaseDomain(finalUrl),
    finalUrlSameDomain: getBaseDomain(url) === getBaseDomain(finalUrl),
    finalUrlSameWebsite: getFullDomain(url) === getFullDomain(finalUrl),
    finalUrlStatusCode: response.status(),
  };
};

const redirects = (requests: HTTPRequest[]): boolean => {
  return requests.length > 0;
};

const getFinalUrl = (page: Page) => {
  const finalUrl = page.url();
  return finalUrl;
};

const isLive = (res: HTTPResponse) => {
  const isLive = res.status() / 100 === 2; // 2xx family
  return isLive;
};
