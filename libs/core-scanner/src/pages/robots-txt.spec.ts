import { mock, MockProxy } from 'jest-mock-extended';
import { Logger } from 'pino';
import { Page, HTTPRequest, HTTPResponse } from 'puppeteer';

import { createRobotsTxtScanner } from './robots-txt';
import { source } from './test-page-source';
import { stubRedirectedNavigation, testInput } from './test-helpers';

describe('robots-txt scanner', () => {
  let mockPage: MockProxy<Page>;
  let redirectRequest: MockProxy<HTTPRequest>;
  let mockResponse: MockProxy<HTTPResponse>;
  let mockLogger: MockProxy<Logger>;
  const finalUrl = 'https://18f.gsa.gov';

  beforeEach(async () => {
    mockPage = mock<Page>();
    mockLogger = mock<Logger>();
    ({ redirectRequest, mockResponse } = stubRedirectedNavigation(
      mockPage,
      'text/html; charset=utf-8',
      finalUrl,
    ));
  });

  it('should scan for a robots-txt page', async () => {
    mockResponse.text.mockResolvedValue(source);
    mockResponse.url.mockReturnValue('https://18f.gsa.gov');
    mockPage.goto.mockResolvedValue(mockResponse);
    redirectRequest.redirectChain.mockReturnValue([]);

    const scanner = createRobotsTxtScanner(mockLogger, testInput);
    const result = await scanner(mockPage);

    expect(result).toEqual({
      robotsTxtScan: {
        robotsTxtFinalUrl: 'https://18f.gsa.gov',
        robotsTxtFinalUrlLive: true,
        robotsTxtTargetUrlRedirects: true,
        robotsTxtFinalUrlMimeType: 'text/html',
        robotsTxtStatusCode: 200,
        robotsTxtDetected: false,
      },
    });
  });
});
