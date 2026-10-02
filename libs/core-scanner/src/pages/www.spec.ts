import { mock, MockProxy } from 'jest-mock-extended';
import { Logger } from 'pino';
import { Page, HTTPResponse } from 'puppeteer';

import { CoreInputDto } from '../core.input.dto';
import { createWwwScanner } from './www';

describe('www scanner', () => {
  let mockPage: MockProxy<Page>;
  let mockResponse: MockProxy<HTTPResponse>;
  let mockLogger: MockProxy<Logger>;
  const finalUrl = 'https://www.18f.gov';

  const input: CoreInputDto = {
    websiteId: 1,
    url: '18f.gov',
    filter: false,
    pageviews: 1,
    visits: 1,
    scanId: '123',
  };

  beforeEach(async () => {
    mockPage = mock<Page>();
    mockResponse = mock<HTTPResponse>();
    mockLogger = mock<Logger>();

    mockPage.url.calledWith().mockReturnValue(finalUrl);
    mockPage.evaluate.mockResolvedValue('18F');
  });

  it('should scan the www page', async () => {
    mockResponse.url.mockReturnValue(finalUrl);
    mockResponse.status.mockReturnValue(200);
    mockPage.goto.mockResolvedValue(mockResponse);

    const scanner = createWwwScanner(mockLogger, input);
    const result = await scanner(mockPage);

    expect(result).toEqual({
      wwwScan: {
        wwwFinalUrl: finalUrl,
        wwwStatusCode: 200,
        wwwTitle: '18F',
        wwwSame: true,
      },
    });
  });

  it('should fall back to the page url when the navigation response is null', async () => {
    mockPage.goto.mockResolvedValue(null);

    const scanner = createWwwScanner(mockLogger, input);
    const result = await scanner(mockPage);

    expect(result).toEqual({
      wwwScan: {
        wwwFinalUrl: finalUrl,
        wwwStatusCode: null,
        wwwTitle: '18F',
        wwwSame: true,
      },
    });
  });
});
