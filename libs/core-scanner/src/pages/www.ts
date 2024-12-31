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

const buildWwwResult = async (
  page: Page,
  wwwUrl: string,
  response: HTTPResponse,
  logger: Logger,
): Promise<WwwScan> => {
  let wwwFinalUrl = response.url();

  const wwwStatusCode = response.status();
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
