import { mock, MockProxy } from 'jest-mock-extended';
import { Logger } from 'pino';
import { Page, HTTPRequest, HTTPResponse } from 'puppeteer';

import { CoreInputDto } from '../core.input.dto';
import { createRobotsTxtScanner } from './robots-txt';
import { source } from './test-page-source';

describe('robots-txt scanner', () => {
  let mockPage: MockProxy<Page>;
  let mockRequest: MockProxy<HTTPRequest>;
  let redirectRequest: MockProxy<HTTPRequest>;
  let mockResponse: MockProxy<HTTPResponse>;
  let mockLogger: MockProxy<Logger>;
  const finalUrl = 'https://18f.gsa.gov';

  beforeEach(async () => {
    mockPage = mock<Page>();
    mockResponse = mock<HTTPResponse>();
    mockRequest = mock<HTTPRequest>();
    redirectRequest = mock<HTTPRequest>();
    mockLogger = mock<Logger>();

    redirectRequest.url.calledWith().mockReturnValue('https://18f.gov');
    mockRequest.redirectChain.calledWith().mockReturnValue([redirectRequest]);
    mockResponse.request.calledWith().mockReturnValue(mockRequest);
    mockResponse.status.calledWith().mockReturnValue(200);
    mockResponse.headers.calledWith().mockReturnValue({
      'Content-Type': 'text/html; charset=utf-8',
    });
    mockPage.goto.calledWith('https://18f.gov').mockResolvedValue(mockResponse);
    mockPage.url.calledWith().mockReturnValue(finalUrl);
  });

  it('should scan for a robots-txt page', async () => {
    const input: CoreInputDto = {
      websiteId: 1,
      url: '18f.gov',
      scanId: '123',
    };

    mockResponse.text.mockResolvedValue(source);
    mockResponse.url.mockReturnValue('https://18f.gsa.gov');
    mockPage.goto.mockResolvedValue(mockResponse);
    redirectRequest.redirectChain.mockReturnValue([]);

    const scanner = createRobotsTxtScanner(mockLogger, input);
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
