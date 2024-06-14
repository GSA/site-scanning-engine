import { Logger } from 'pino';
import { Page } from 'puppeteer';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { getHttpsUrl } from '../util';

export const createClientRedirectScanner = (
  logger: Logger,
  input: CoreInputDto,
) => {
  return async (page) => {
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

async function scanForClientRedirect(logger: Logger, page: Page, url: string) {
  await page.goto(url, { waitUntil: 'load' });

  const { usesMetaRefresh, usesJsRedirect } = await page.evaluate(() => {
    const meta = document.querySelector('meta[http-equiv="refresh"]');
    const usesMetaRefresh = !!meta;

    let usesJsRedirect = false;
    Array.from(document.scripts).some((script) => {
      const content = script.textContent || script.src;
      usesJsRedirect =
        /location\s*=\s*['"]/.test(content) ||
        /location\.replace\s*\(/.test(content) ||
        /location\.href\s*=\s*['"]/.test(content) ||
        /window\.location\s*=\s*['"]/.test(content) ||
        /window\.location\.replace\s*\(/.test(content) ||
        /window\.location\.href\s*=\s*['"]/.test(content) ||
        /window\.history\.pushState\s*\(/.test(content);
      return usesJsRedirect;
    });

    return { usesMetaRefresh, usesJsRedirect };
  });

  logger.debug(`Uses Meta Refresh: ${usesMetaRefresh}`);
  logger.debug(`Uses JavaScript Redirect: ${usesJsRedirect}`);

  const hasClientRedirect = usesMetaRefresh || usesJsRedirect;

  return {
    hasClientRedirect,
    usesJsRedirect,
    usesMetaRefresh,
  };
}
