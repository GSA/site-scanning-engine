import { Logger } from 'pino';
import { HTTPResponse, Page } from 'puppeteer';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { getHttpsUrl } from '../util';
import { wwwScan } from 'entities/scan-data.entity';

export const createWwwScanner = (logger: Logger, input: CoreInputDto) => {
  return async (page: Page) => {
    const ineligibleUrl =
      input.url.startsWith('www.') || hasSubDomain(input.url);

    if (ineligibleUrl) {
      return {
        wwwScan: { wwwFinalUrl: null, wwwStatusCode: null, wwwSame: null },
      };
    }

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

function hasSubDomain(url: string): boolean {
  const domainRegex = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
  return !domainRegex.test(url) || url.split('.').length !== 2;
}
