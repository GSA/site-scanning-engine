import { Page, HTTPRequest, HTTPResponse } from 'puppeteer';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { UrlScan } from 'entities/scan-data.entity';

import { getHttpsUrl, getMIMEType } from '../pages/helpers';
import { getBaseDomain } from '../test-helper';

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
    targetUrlBaseDomain: getBaseDomain(url),
    finalUrl: finalUrl,
    finalUrlMIMEType: getMIMEType(response),
    finalUrlIsLive: isLive(response),
    finalUrlBaseDomain: getBaseDomain(finalUrl),
    finalUrlSameDomain: getBaseDomain(url) === getBaseDomain(finalUrl),
    finalUrlSameWebsite:
      getPathname(url) == getPathname(finalUrl) &&
      getBaseDomain(url) == getBaseDomain(finalUrl),
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

const getPathname = (url: string) => {
  const parsed = new URL(url);
  return parsed.pathname;
};

const isLive = (res: HTTPResponse) => {
  const isLive = res.status() / 100 === 2; // 2xx family
  return isLive;
};
