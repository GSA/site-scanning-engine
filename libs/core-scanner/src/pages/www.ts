import { Logger } from 'pino';
import { HTTPResponse, Page } from 'puppeteer';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { getHttpsUrl } from '../util';
import { wwwScan } from 'entities/scan-data.entity';

export const createWwwScanner = (logger: Logger, input: CoreInputDto) => {
  return async (page: Page) => {
    page.on('console', (message) => logger.debug(`Page Log: ${message.text()}`));
    page.on('error', (error) => logger.warn({ error }, `Page Error: ${error.message}`));
    page.on('response', (response)=> logger.debug({sseResponse: response.status()}, `Response status: ${response.status()}`));
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
