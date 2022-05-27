import { Logger } from 'pino';
import { HTTPResponse } from 'puppeteer';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { RobotsTxtScan } from 'entities/scan-data.entity';
import { RobotsTxtPageScans } from 'entities/scan-page.entity';

import { getHttpsUrl, getMIMEType } from '../util';

export const createRobotsTxtScanner = (logger: Logger, input: CoreInputDto) => {
  const url = getHttpsUrl(input.url);
  return async (robotsPage): Promise<RobotsTxtPageScans> => {
    // go to the robots page from the target url
    const robotsUrl = new URL(url);
    robotsUrl.pathname = 'robots.txt';
    const robotsResponse = await robotsPage.goto(robotsUrl.toString());
    // extract the html page source
    const robotsText = await robotsResponse.text();

    return {
      robotsTxtScan: buildRobotTxtResult(
        logger,
        robotsPage,
        robotsResponse,
        robotsText,
      ),
    };
  };
};

const buildRobotTxtResult = (
  logger: Logger,
  logData: any,
  robotsResponse: HTTPResponse,
  robotsText: string,
): RobotsTxtScan => {
  const robotsUrl = new URL(robotsResponse.url());
  const robotsStatus = robotsResponse.status();
  const robotsLive = robotsStatus / 100 === 2;
  const robotsTxtDetected = robotsUrl.pathname === '/robots.txt' && robotsLive;

  return {
    robotsTxtFinalUrl: robotsResponse.url(),
    robotsTxtFinalUrlLive: robotsLive,
    robotsTxtTargetUrlRedirects:
      robotsResponse.request().redirectChain().length > 0,
    robotsTxtFinalUrlMimeType: getMIMEType(robotsResponse),
    robotsTxtStatusCode: robotsStatus,

    robotsTxtDetected,
    ...(robotsTxtDetected
      ? {
          robotsTxtFinalUrlSize: Buffer.byteLength(robotsText, 'utf-8'),
          robotsTxtCrawlDelay: findRobotsCrawlDelay(
            logger,
            logData,
            robotsText,
          ),
          robotsTxtSitemapLocations: findRobotsSitemapLocations(
            logger,
            logData,
            robotsText,
          ),
        }
      : {}),
  };
};

const findRobotsCrawlDelay = (
  logger: Logger,
  logData: any,
  robotsTxt: string,
): number | null => {
  const directives = robotsTxt.split('\n');
  let crawlDelay: number = null;

  for (const directive of directives) {
    if (directive.toLowerCase().startsWith('crawl-delay:')) {
      try {
        crawlDelay = parseInt(directive.split(' ')[1]);
        if (isNaN(crawlDelay)) {
          crawlDelay = null;
        }
      } catch (e) {
        const err = e as Error;
        logger.warn({
          msg: `Could not parse this crawl delay: ${directive}. ${err.message}`,
          ...logData,
        });
      }
    }
  }

  return crawlDelay;
};

const findRobotsSitemapLocations = (
  logger: Logger,
  logData: any,
  robotsTxt: string,
) => {
  const directives = new Set(robotsTxt.split(/\r?\n/));
  const sitemapLocations: string[] = [];

  for (const directive of Array.from(directives).sort()) {
    if (directive.toLowerCase().startsWith('sitemap:')) {
      try {
        const sitemapLocation = directive.split(' ')[1];
        sitemapLocations.push(sitemapLocation);
      } catch (e) {
        const err = e as Error;
        logger.warn({
          msg: `Could not parse this sitemap: ${directive}. ${err.message}`,
          ...logData,
        });
      }
    }
  }

  return sitemapLocations.join(',');
};
