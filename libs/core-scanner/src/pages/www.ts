import { Logger } from 'pino';
import { HTTPResponse, Page } from 'puppeteer';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { getHttpsUrl, createRequestHandlers } from '../util';
import { WwwScan } from 'entities/scan-data.entity';

export const createWwwScanner = (logger: Logger, input: CoreInputDto) => {
  return async (page: Page) => {
    createRequestHandlers(page, logger);
    const wwwUrl = getHttpsUrl(`www.${input.url}`);

    const wwwResponse = await page.goto(wwwUrl.toString(), {
      waitUntil: 'networkidle2',
    });
    return {
      wwwScan: await buildWwwResult(page, wwwUrl, wwwResponse, logger),
    };
  };
};

/**
 * Builds the www scan result from the navigation outcome.
 *
 * @param page The page after navigating to the www URL.
 * @param wwwUrl The www URL that was requested.
 * @param response The navigation response. Puppeteer resolves `goto()` to null
 * when the request fails at the transport layer even though a document may
 * have rendered, so the final URL falls back to `page.url()` and the status
 * code is null, matching the primary page's url-scan.
 * @param logger Logger for the scan.
 */
const buildWwwResult = async (
  page: Page,
  wwwUrl: string,
  response: HTTPResponse | null,
  logger: Logger,
): Promise<WwwScan> => {
  if (!response) {
    logger.warn(`No navigation response received for ${wwwUrl}`);
  }
  let wwwFinalUrl = response ? response.url() : page.url();

  const wwwStatusCode = response ? response.status() : null;
  const wwwTitle = await findPageTitleText(page);

  logger.info(`Final URL for www is ${wwwFinalUrl}`);

  // remove trailing forward slash if needed before comparing against whatever
  // wwwUrl was passed
  if (wwwFinalUrl.endsWith('/')) {
    wwwFinalUrl = wwwFinalUrl.slice(0, -1);
  }

  const wwwSame = wwwFinalUrl === wwwUrl;

  return {
    wwwFinalUrl,
    wwwStatusCode,
    wwwTitle,
    wwwSame,
  };
};

const findPageTitleText = async (page: Page): Promise<string> => {
  return await page.evaluate(() => {
    const title = document.title;
    return typeof title === 'string' ? title.trim() : '';
  });
};
