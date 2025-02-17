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
          sitemapXmlLastMod: getLastModDate(sitemapText),
          sitemapXmlPageHash: await getPageMd5Hash(sitemapPage),
        }
      : {}),
  };
};

function getLastModDate(sitemapText: string) {
  const re = /<lastmod>(.*?)<\/lastmod>/g;
  const matches = [...sitemapText.matchAll(re)];
  return matches.length > 0 ? matches[matches.length - 1][1] : null;
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
