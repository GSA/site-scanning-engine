import * as _ from 'lodash';
import { HTTPResponse, Page } from 'puppeteer';
import { Logger } from 'pino';

type UnwrapPromiseArray<T> = {
  [K in keyof T]: T[K] extends Promise<infer O> ? O : T[K];
};

// A type-safe Promise.all() alternative.
export function promiseAll<T extends ReadonlyArray<any>>(
  args: T,
): Promise<UnwrapPromiseArray<T>> {
  return Promise.all(args) as any;
}

export const getBaseDomain = (url: string): string => {
  const parsedUrl = new URL(url);
  const baseDomain = _.takeRight(_.split(parsedUrl.hostname, '.'), 2);
  return _.join(baseDomain, '.');
};

export const getFullDomain = (url: string): string => {
  const parsedUrl = new URL(url);
  return parsedUrl.hostname;
};

export const getHttpsUrl = (url: string): string => {
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    return `https://${url.toLowerCase()}`;
  } else if (url.startsWith('http://')) {
    return `${url.slice(0, 4)}s${url.slice(4)}`;
  } else {
    return url.toLowerCase();
  }
};

export const getMIMEType = (res: HTTPResponse): string => {
  const headers = res.headers();
  if (headers['Content-Type'] || headers['content-type']) {
    const contentType = headers['Content-Type'] || headers['content-type'];
    const mimetype = contentType.split(';')[0];
    return mimetype;
  } else {
    return 'unknown';
  }
};

export const getWithSubdomain = (url: string): string | null => {
  if (!url.match(/^https?:\/\//)) return null;
  const parsedUrl = new URL(url);
  return _.takeRight(_.split(parsedUrl.origin, '//'))[0];
};

export const getTopLevelDomain = (url: string): string | null => {
  const domainPattern = /^(?:https?:\/\/)?(?:www\.)?([^\/:]+)(?:[:\/]|$)/;
  const tldPattern = /\.([a-z0-9\-]+)$/i;

  const domainMatch = url.match(domainPattern);
  if (!domainMatch) return null;

  const domainParts = domainMatch[1].split('.');
  const tld = domainParts[domainParts.length - 1];

  return tldPattern.test('.' + tld) ? tld : null;
};

export const isLive = (res: HTTPResponse): boolean => {
  const http200FamilyCodes = [200, 201, 202, 203, 204, 205, 206];
  return _.includes(http200FamilyCodes, res.status());
};

export function getTruncatedUrl(url: string): string {
  return url.split('?')[0]; // Split the URL and take the part before the `?`
}

export function createRequestHandlers(page: Page, logger: Logger) {
  page.on('console', (message) => logger.debug({sseMessage: message }, `Page Log: ${message.text()}`));
  page.on('error', (error) => logger.warn({ error }, `Page Error: ${error.message}`));
  page.on('response', (response)=> response.status() !== 200 && logger.debug({ sseResponseTiming: response.timing(), sseResponseUrl: response.url(), sseResponseStatus: response.status()}, `A ${response.status()} was returned from: ${getTruncatedUrl(response.url())} `));
  page.on('requestfailed', (request) => logger.warn({ sseRequestFailure: request.failure(), sseRequestUrl: request.url() }, `Request failed for ${getTruncatedUrl(request.url())}`));
};