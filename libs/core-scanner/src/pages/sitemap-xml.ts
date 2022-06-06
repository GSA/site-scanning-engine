import { Logger } from 'pino';
import { Page, HTTPResponse } from 'puppeteer';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { SitemapXmlScan } from 'entities/scan-data.entity';
import { SitemapXmlPageScans } from 'entities/scan-page.entity';

import { getHttpsUrl, getMIMEType } from '../util';

export const createSitemapXmlScanner = (
  logger: Logger,
  input: CoreInputDto,
) => {
  const url = getHttpsUrl(input.url);
  return async (sitemapPage: Page): Promise<SitemapXmlPageScans> => {
    // go to the sitemap page from the target url
    const sitemapUrl = new URL(url);
    sitemapUrl.pathname = 'sitemap.xml';
    logger.info('Going to sitemap.xml...');
    const sitemapResponse = await sitemapPage.goto(sitemapUrl.toString());
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
  const sitemapStatus = sitemapResponse.status();
  const sitemapLive = sitemapStatus / 100 === 2;

  const sitemapXmlDetected =
    sitemapUrl.pathname === '/sitemap.xml' && sitemapLive;

  return {
    sitemapXmlFinalUrl: sitemapUrl.toString(),
    sitemapXmlFinalUrlLive: sitemapLive,
    sitemapTargetUrlRedirects:
      sitemapResponse.request().redirectChain().length > 0,
    sitemapXmlFinalUrlMimeType: getMIMEType(sitemapResponse),
    sitemapXmlStatusCode: sitemapStatus,

    sitemapXmlDetected,
    ...(sitemapXmlDetected
      ? {
          sitemapXmlFinalUrlFilesize: Buffer.byteLength(sitemapText, 'utf-8'),
          sitemapXmlCount: await getUrlCount(sitemapPage),
          sitemapXmlPdfCount: getPdfCount(sitemapText),
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
