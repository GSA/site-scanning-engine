import * as _ from 'lodash';
import { HTTPResponse } from 'puppeteer';

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
