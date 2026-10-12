import { mock, MockProxy } from 'jest-mock-extended';
import { Logger } from 'pino';
import { HTTPResponse, Page } from 'puppeteer';

import { createWwwScanner } from './www';
import { testInput } from './test-helpers';

describe('www scanner', () => {
  let mockPage: MockProxy<Page>;
  let mockLogger: MockProxy<Logger>;

  beforeEach(() => {
    mockPage = mock<Page>();
    mockLogger = mock<Logger>();
    mockPage.evaluate.mockResolvedValue('18F');
  });

  it('should scan the www page', async () => {
    const mockResponse = mock<HTTPResponse>();
    mockResponse.url.mockReturnValue('https://www.18f.gov/');
    mockResponse.status.mockReturnValue(200);
    mockPage.goto.mockResolvedValue(mockResponse);

    const scanner = createWwwScanner(mockLogger, testInput);
    const result = await scanner(mockPage);

    expect(result).toEqual({
      wwwScan: {
        wwwFinalUrl: 'https://www.18f.gov',
        wwwStatusCode: 200,
        wwwTitle: '18F',
        wwwSame: true,
      },
    });
  });

  it('degrades gracefully when navigation resolves to a null response', async () => {
    mockPage.goto.mockResolvedValue(null);
    mockPage.url.mockReturnValue('https://www.18f.gov/');

    const scanner = createWwwScanner(mockLogger, testInput);
    const result = await scanner(mockPage);

    expect(result).toEqual({
      wwwScan: {
        wwwFinalUrl: 'https://www.18f.gov',
        wwwStatusCode: null,
        wwwTitle: '18F',
        wwwSame: true,
      },
    });
  });
});
