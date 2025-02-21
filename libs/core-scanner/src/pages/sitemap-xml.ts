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
      ),
    };
  };
};

const buildSitemapResult = async (
  sitemapResponse: HTTPResponse,
  sitemapText: string,
  sitemapPage: Page,
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
          sitemapXmlLastMod: await getLastModDate(sitemapText, sitemapPage),
          sitemapXmlPageHash: await getPageMd5Hash(sitemapPage),
        }
      : {}),
  };
};

async function getLastModDate(sitemapText: string, sitemapPage: Page) {
  if (!sitemapText || !sitemapPage) {
    return null;
  }
  let dates = getModDatesByLastmodTag(sitemapText);
  if (!dates) {
    dates = await getModDatesByTDTag(sitemapPage);
  }
  if (!dates || dates.length === 0) {
    return null;
  }
  
  const lastModDate = dates[0];
  return lastModDate;
}

function getModDatesByLastmodTag(sitemapText: string): string[] | null {
  const re = /<lastmod>(.*?)<\/lastmod>/g;
  const matches = [...sitemapText.matchAll(re)];
  if (matches.length > 0) {
    return matches.map(match => match[1]);
  }

  return null;
}

async function getModDatesByTDTag(sitemapPage: Page): Promise<string[] | null> {
  const tdTexts = await sitemapPage.$$eval('td', (tds) =>
    tds.map(td => td.textContent?.trim()).filter(text => text !== undefined)
  );
  if (!tdTexts || tdTexts.length === 0) {
    return null;
  }
  const dateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([-+]\d{2}:\d{2}|\.\d+)?/;
  const extDateRegex = /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/;
  const dates = tdTexts.filter(text => dateRegex.test(text));
  if (dates.length === 0) {
    const dates = tdTexts.filter(text => extDateRegex.test(text));
  }
  return dates.length > 0 ? dates : null;
}



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
