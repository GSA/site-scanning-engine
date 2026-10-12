import { mock, MockProxy } from 'jest-mock-extended';
import { Logger } from 'pino';
import { Page, HTTPRequest, HTTPResponse } from 'puppeteer';

import { CoreInputDto } from '../core.input.dto';
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

  it('reads directives whatever whitespace follows the colon', async () => {
    const input: CoreInputDto = {
      websiteId: 1,
      url: '18f.gov',
      filter: false,
      pageviews: 1,
      visits: 1,
      scanId: '123',
    };

    const robotsTxt = [
      'User-agent: *',
      'Crawl-delay:10',
      'Sitemap:https://18f.gsa.gov/sitemap-no-space.xml',
      'Sitemap:\thttps://18f.gsa.gov/sitemap-tab.xml',
      'Sitemap:  https://18f.gsa.gov/sitemap-two-spaces.xml',
    ].join('\n');

    mockResponse.text.mockResolvedValue(robotsTxt);
    mockResponse.url.mockReturnValue('https://18f.gsa.gov/robots.txt');
    mockPage.goto.mockResolvedValue(mockResponse);
    redirectRequest.redirectChain.mockReturnValue([]);

    const scanner = createRobotsTxtScanner(mockLogger, input);
    const result = await scanner(mockPage);

    expect(result.robotsTxtScan.robotsTxtCrawlDelay).toEqual(10);
    // The scanner sorts the raw directive lines, so the order follows the whitespace
    // that comes after the colon: tab, then space, then the URL itself.
    expect(result.robotsTxtScan.robotsTxtSitemapLocations).toEqual(
      [
        'https://18f.gsa.gov/sitemap-tab.xml',
        'https://18f.gsa.gov/sitemap-two-spaces.xml',
        'https://18f.gsa.gov/sitemap-no-space.xml',
      ].join(','),
    );
  });
});
