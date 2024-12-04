import * as _ from 'lodash';
import { HTTPResponse, Page } from 'puppeteer';
import { Logger } from 'pino';
import { exec } from 'child_process';
import { logCount } from 'libs/logging/src/metric-utils';

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
  page.on('response', (response)=> response.status() !== 200 && logger.debug({ sseResponseUrl: response.url(), sseResponseStatus: response.status()}, `A ${response.status()} was returned from: ${getTruncatedUrl(response.url())} `));
  page.on('requestfailed', (request) => logger.warn({ sseRequestUrl: request.url() }, `Request failed: ${getTruncatedUrl(request.url())}`));
};


export function logRunningProcesses(logger: Logger, scanStage: string): void {
  exec('ps aux', (error, stdout, stderr) => {
      if (error) {
          logger.error({ sseRunningProcError: error, sseScanStage: scanStage }, `Error executing ps command: ${error.message}`);
          return;
      }
      if (stderr) {
          logger.error({ sseRunningProcError: stderr, sseScanStage: scanStage }, `stderr: ${stderr}`);
          return;
      }

      const lines = stdout.trim().split('\n');
      const processCount = lines.length - 1; // Subtract 1 to exclude the header
      const headers = lines[0].split(/\s+/); // Split by whitespace

      const processes = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(/\s+/);
        const process = {};

        for (let j = 0; j < headers.length; j++) {
          process[headers[j]] = values[j];
        }

        processes.push(process);
      }
      const combinedProcesses = processes.map((process) => process.COMMAND).join(',');
      const processJson = [];
      processes.forEach((process) => {
        processJson.push(process.COMMAND);
      });
      
      logCount(logger, {}, `${scanStage}.process.count`, `${processCount} processes running at the '${scanStage}' of scan.`, processCount);

  });
}

export function printMemoryUsage(logger: Logger, metadata: any) {
  if (!metadata) {
    metadata = {};
  }
  const used = process.memoryUsage();
  for (const key in used) {
    const valueMb = Math.round((used[key] / 1024 / 1024) * 100) / 100;
    logCount(logger, {
        metricUnit: 'megabytes',
        metadata,
      },
      `scanner.core.memory.used.${key}.mb`,
      `Memory used: ${key}: ${valueMb} MB`,
      valueMb
    );
  }
}