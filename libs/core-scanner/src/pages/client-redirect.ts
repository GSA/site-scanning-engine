import { Logger } from 'pino';
import { Page } from 'puppeteer';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { getHttpsUrl, createRequestHandlers } from '../util';

export const createClientRedirectScanner = (
  logger: Logger,
  input: CoreInputDto,
) => {
  return async (page: Page) => {
    const url = getHttpsUrl(input.url);
    const { hasClientRedirect, usesJsRedirect, usesMetaRefresh } =
      await scanForClientRedirect(logger, page, url);

    return {
      hasClientRedirect,
      usesJsRedirect,
      usesMetaRefresh,
    };
  };
};

type ClientRedirectResults = {
  hasClientRedirect: boolean;
  usesJsRedirect: boolean;
  usesMetaRefresh: boolean;
};

async function scanForClientRedirect(
  logger: Logger,
  page: Page,
  url: string,
): Promise<ClientRedirectResults> {
  createRequestHandlers(page, logger);
  let firstResponseHandled = false;

  const firstResponseResult = new Promise<ClientRedirectResults>((resolve) => {
    page.on('response', async (response) => {
      if (!firstResponseHandled && !response.request().redirectChain().length) {
        firstResponseHandled = true;
        const text = await response.text();

        const usesMetaRefresh = /<meta\s+http-equiv="refresh"/i.test(text);

        const usesJsRedirect =
          /location\s*=\s*['"]/.test(text) ||
          /location\.replace\s*\(/.test(text) ||
          /location\.href\s*=\s*['"]/.test(text) ||
          /window\.location\s*=\s*['"]/.test(text) ||
          /window\.location\.replace\s*\(/.test(text) ||
          /window\.location\.href\s*=\s*['"]/.test(text) ||
          /window\.history\.pushState\s*\(/.test(text);

        logger.debug(`Uses Meta Refresh: ${usesMetaRefresh}`);
        logger.debug(`Uses JavaScript Redirect: ${usesJsRedirect}`);

        const hasClientRedirect = usesMetaRefresh || usesJsRedirect;

        resolve({
          hasClientRedirect,
          usesJsRedirect,
          usesMetaRefresh,
        });
      }
    });
  });

  await page.goto(url, { waitUntil: 'load' });

  return await firstResponseResult;
}
