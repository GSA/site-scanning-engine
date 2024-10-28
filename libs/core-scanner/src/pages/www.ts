import { Logger } from 'pino';
import { HTTPResponse, Page } from 'puppeteer';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { getHttpsUrl, createRequestHandlers } from '../util';
import { wwwScan } from 'entities/scan-data.entity';

export const createWwwScanner = (logger: Logger, input: CoreInputDto) => {
  return async (page: Page) => {
    createRequestHandlers(page, logger);
    const wwwUrl = getHttpsUrl(`www.${input.url}`);

    const wwwResponse = await page.goto(wwwUrl.toString(), {
      waitUntil: 'networkidle0',
    });
    return {
      wwwScan: await buildWwwResult(wwwUrl, wwwResponse),
    };
  };
};

const buildWwwResult = async (
  wwwUrl: string,
  response: HTTPResponse,
): Promise<wwwScan> => {
  let wwwFinalUrl = response.url();

  const wwwStatusCode = response.status();

  // remove trailing forward slash if needed before comparing against whatever
  // wwwUrl was passed
  if (wwwFinalUrl.endsWith('/')) {
    wwwFinalUrl = wwwFinalUrl.slice(0, -1);
  }

  const wwwSame = wwwFinalUrl === wwwUrl;

  return {
    wwwFinalUrl,
    wwwStatusCode,
    wwwSame,
  };
};
