import { Logger } from 'pino';
import { Page, HTTPResponse } from 'puppeteer';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { SitemapXmlScan } from 'entities/scan-data.entity';
import { SitemapXmlPageScans } from 'entities/scan-page.entity';

import { getHttpsUrl, getMIMEType, isLive, createRequestHandlers, getPageMd5Hash } from '../util';

export const createSitemapXmlScanner = (
  logger: Logger,
  input: CoreInputDto,
) => {
  const url = getHttpsUrl(input.url);
  return async (sitemapPage: Page): Promise<SitemapXmlPageScans> => {
    createRequestHandlers(sitemapPage, logger);
    // go to the sitemap page from the target url
    const sitemapUrl = new URL(url);
    sitemapUrl.pathname = 'sitemap.xml';
    logger.info('Going to sitemap.xml...');
    const sitemapResponse = await sitemapPage.goto(sitemapUrl.toString(), {
      waitUntil: 'networkidle2',
    });
    logger.info('Got sitemap.xml!');
    // extract the html page source
    const sitemapText = await sitemapResponse.text();
    logger.info('Got sitemap.xml text!');

    return {
      sitemapXmlScan: await buildSitemapResult(
        sitemapResponse,
        sitemapText,
        sitemapPage,
        logger,
      ),
    };
  };
};

const buildSitemapResult = async (
  sitemapResponse: HTTPResponse,
  sitemapText: string,
  sitemapPage: Page,
  logger: Logger,
): Promise<SitemapXmlScan> => {
  const sitemapUrl = new URL(sitemapResponse.url());
  const sitemapLive = isLive(sitemapResponse);

  const sitemapXmlDetected =
    sitemapUrl.pathname.endsWith('/sitemap.xml') && sitemapLive;

  

  return {
    sitemapXmlFinalUrl: sitemapUrl.toString(),
    sitemapXmlFinalUrlLive: sitemapLive,
    sitemapTargetUrlRedirects:
      sitemapResponse.request().redirectChain().length > 0,
    sitemapXmlFinalUrlMimeType: getMIMEType(sitemapResponse),
    sitemapXmlStatusCode: sitemapResponse.status(),

    sitemapXmlDetected,
    ...(sitemapXmlDetected
      ? {
          sitemapXmlFinalUrlFilesize: Buffer.byteLength(sitemapText, 'utf-8'),
          sitemapXmlCount: await getUrlCount(sitemapPage),
          sitemapXmlPdfCount: getPdfCount(sitemapText),
          sitemapXmlLastMod: await getLastModDate(sitemapText, sitemapPage, logger),
          sitemapXmlPageHash: await getPageMd5Hash(sitemapPage),
        }
      : {}),
  };
};

const getUrlCount = async (page: Page) => {
  const urlCount = await page.evaluate(() => {
    const urls = [...document.getElementsByTagName('url')];
    return urls.length;
  });

  return urlCount;
};

const getPdfCount = (sitemapText: string) => {
  const re = /\.pdf/g;
  const occurrenceCount = [...sitemapText.matchAll(re)].length;
  return occurrenceCount;
};

/**
 * Date formats to try when parsing dates.
 * Each format is represented by a regex and a parser function.
 */
const dateFormats = [
  // Try MM/DD/YYYY (e.g., 02/20/2025)
  { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, parser: (m: RegExpMatchArray) => new Date(`${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`) },
  // Try DD/MM/YYYY (e.g., 20/02/2025)
  { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, parser: (m: RegExpMatchArray) => new Date(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`) },
  // Try YYYY-MM-DD (e.g., 2025-02-20)
  { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, parser: (m: RegExpMatchArray) => new Date(`${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`) },
  // Try (2025-02-20T01:00:02-05:00)
  { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{1,2}):(\d{1,2})([-+]\d{2}:\d{2})$/, parser: (m: RegExpMatchArray) => new Date(`${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}T${m[4].padStart(2, '0')}:${m[5].padStart(2, '0')}:${m[6].padStart(2, '0')}${m[7]}`) },
  // Try 2016-07-08T13:24Z
  { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{1,2})(Z)$/, parser: (m: RegExpMatchArray) => new Date(`${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}T${m[4].padStart(2, '0')}:${m[5].padStart(2, '0')}${m[6]}`) },
  // Try 2025-01-31 22:33
  { regex: /^(\d{4})-(\d{1,2})-(\d{1,2}) (\d{1,2}):(\d{1,2})$/, parser: (m: RegExpMatchArray) => new Date(`${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}T${m[4].padStart(2, '0')}:${m[5].padStart(2, '0')}`) },
];

/**
 * Gets the last modification date from the sitemap XML.
 *
 * @param sitemapText The text content of the sitemap XML
 * @param sitemapPage The Puppeteer page object for the sitemap
 * @param logger A logger instance for logging
 * @returns The last modification date as a string or null if not found
 */
async function getLastModDate(sitemapText: string, sitemapPage: Page, logger: Logger) {
  if (!sitemapText || !sitemapPage) {
    return null;
  }
  let dates = getModDatesByLastmodTag(sitemapText);
  if (!dates) {
    dates = await getModDatesByTDTag(sitemapPage, logger);
  }
  if (!dates || dates.length === 0) {
    return null;
  }
  const parsedDates = convertStringsToDates(dates, logger);

  const mostRecentDate = getMostRecentDate(parsedDates, logger);

  logger.info({sitemapXmlLastMod: mostRecentDate.toISOString()}, `Most recent date found: ${mostRecentDate.toISOString()}`);
  return mostRecentDate.toISOString();
}

/**
 * Converts an array of date strings to Date objects.
 *
 * @param dates An array of strings representing dates
 * @param logger A logger instance for logging
 * @returns An array of Date objects
 */
function convertStringsToDates(dates: string[], logger: Logger): Date[] {
  return dates.map(date => parseDate(date, logger));
}

/**
 * Finds the most recent date from an array of Date objects.
 *
 * @param dates An array of Date objects
 * @param logger A logger instance for logging
 * @returns The most recent Date object or null if the array is empty
 */
function getMostRecentDate(dates: Date[], logger: Logger): Date | null {
  return dates.sort((a, b) => b.getTime() - a.getTime())[0];
}

/**
 * Checks if a string is a valid date format.
 *
 * @param dateStr The string to check
 * @param logger A logger instance for logging
 * @returns True if the string is a valid date format, false otherwise
 */
function isDate(dateStr: string, logger: Logger): boolean {
  for (const { regex, parser } of dateFormats) {
    const match = dateStr.match(regex);
    if (match) {
      const date = parser(match);
      return !isNaN(date.getTime());
    }
  }
  return false;
}

/**
 * Extracts modification dates from the sitemap XML using <lastmod> tags.
 *
 * @param sitemapText The text content of the sitemap XML
 * @returns An array of modification dates as strings or null if not found
 */
function getModDatesByLastmodTag(sitemapText: string): string[] | null {
  const re = /<lastmod>\s*(.*?)\s*<\/lastmod>/g;
  const matches = [...sitemapText.matchAll(re)];
  if (matches.length > 0) {
    return matches.map(match => match[1]);
  }

  return null;
}

/**
 * Extracts modification dates from the sitemap XML using <td> tags.
 *
 * @param sitemapPage The Puppeteer page object for the sitemap
 * @param logger A logger instance for logging
 * @returns An array of modification dates as strings or null if not found
 */
async function getModDatesByTDTag(sitemapPage: Page, logger: Logger): Promise<string[] | null> {
  const tdTexts = await sitemapPage.$$eval('td', (tds) =>
    tds.map(td => td.textContent?.trim()).filter(text => text !== undefined)
  );
  if (!tdTexts || tdTexts.length === 0) {
    return null;
  }
  const modDates = tdTexts.map(text => text.trim()).filter(text => isDate(text, logger));
  const parsedDates = modDates.map(date => parseDate(date, logger));
  const stringDates = parsedDates.map(date => date.toISOString());

  return stringDates.length > 0 ? stringDates : null;
}

/**
 * Parses a date string into a Date object.
 *
 * @param dateStr The date string to parse
 * @param logger A logger instance for logging
 * @returns The parsed Date object or a fallback date if parsing fails
 */
function parseDate(dateStr: string, logger: Logger): Date {
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  const fallbackDate = parseFallbackDate(dateStr);
  if (fallbackDate) {
    return fallbackDate;
  }

  return new Date(0);
}

/**
 * Parses a date string using fallback formats.
 *
 * @param dateStr The date string to parse
 * @returns The parsed Date object or null if parsing fails
 */
function parseFallbackDate(dateStr: string): Date | null {
  for (const { regex, parser } of dateFormats) {
    const match = dateStr.match(regex);
    if (match) {
      return parser(match);
    }
  }

  return null;
}
