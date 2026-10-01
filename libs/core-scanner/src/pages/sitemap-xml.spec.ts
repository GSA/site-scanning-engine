import { mock, MockProxy } from 'jest-mock-extended';
import { Logger } from 'pino';
import { Page, HTTPRequest, HTTPResponse } from 'puppeteer';
import { HttpService } from '@nestjs/axios';

import { createSitemapXmlScanner, getSitemapUsingAxios } from './sitemap-xml';
import { source } from './test-page-source';
import {
  stubHttpGet,
  stubRedirectedNavigation,
  testInput,
} from './test-helpers';

describe('sitemap-xml scanner', () => {
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
      'text/xml; charset=utf-8',
      finalUrl,
    ));
  });

  it('should scan for a sitemap-xml page', async () => {
    mockResponse.text.mockResolvedValue(source);
    mockResponse.url.mockReturnValue('https://18f.gsa.gov/sitemap.xml');
    mockPage.goto.mockResolvedValue(mockResponse);
    redirectRequest.redirectChain.mockReturnValue([]);
    const mockHttpService = mock<HttpService>();
    stubHttpGet(mockHttpService, 404, 'Not Found');

    const scanner = createSitemapXmlScanner(
      mockLogger,
      testInput,
      mockHttpService,
    );
    const result = await scanner(mockPage);

    expect(result).toEqual({
      sitemapXmlScan: {
        sitemapXmlCount: undefined,
        sitemapXmlFinalUrlFilesize: 15,
        sitemapXmlPdfCount: 0,
        sitemapXmlFinalUrl: 'https://18f.gsa.gov/sitemap.xml',
        sitemapXmlFinalUrlLive: true,
        sitemapTargetUrlRedirects: true,
        sitemapXmlFinalUrlMimeType: 'text/xml',
        sitemapXmlLastMod: null,
        sitemapXmlPageHash: null,
        sitemapXmlStatusCode: 200,
        sitemapXmlDetected: true,
      },
    });
  });
});
