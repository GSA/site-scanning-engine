import { HTTPRequest, Page } from 'puppeteer';
import { Logger } from 'pino';

export const createOutboundRequestsExtractor = (page: Page) => {
  const outboundRequests: HTTPRequest[] = [];
  page.on('request', (request) => {
    outboundRequests.push(request);
  });
  return () => {
    return outboundRequests;
  };
};

export const createCSSRequestsExtractor = async (
  page: Page,
  logger: Logger,
) => {
  const cssPages = [];
  page.on('response', async (response) => {
    if (response.ok() && response.request().resourceType() == 'stylesheet') {
      try {
        const cssPage = await response.text();
        cssPages.push(cssPage);
      } catch (error) {
        logger.error(error.message, error.stack);
      }
    }
  });
  return () => {
    return cssPages;
  };
};
