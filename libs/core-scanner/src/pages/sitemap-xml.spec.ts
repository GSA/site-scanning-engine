import { mock, MockProxy } from 'jest-mock-extended';
import { Logger } from 'pino';
import { Page, HTTPRequest, HTTPResponse } from 'puppeteer';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';

import { CoreInputDto } from '../core.input.dto';
import { createSitemapXmlScanner, getSitemapUsingAxios } from './sitemap-xml';
import { source } from './test-page-source';
import { of } from 'rxjs';

describe('sitemap-xml scanner', () => {
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
      'Content-Type': 'text/xml; charset=utf-8',
    });
    mockPage.goto.calledWith('https://18f.gov').mockResolvedValue(mockResponse);
    mockPage.url.calledWith().mockReturnValue(finalUrl);
  });

  it('should scan for a sitemap-xml page', async () => {
    const input: CoreInputDto = {
      websiteId: 1,
      url: '18f.gov',
      filter: false,
      pageviews: 1,
      visits: 1,
      scanId: '123',
    };

    mockResponse.text.mockResolvedValue(source);
    mockResponse.url.mockReturnValue('https://18f.gsa.gov/sitemap.xml');
    mockPage.goto.mockResolvedValue(mockResponse);
    redirectRequest.redirectChain.mockReturnValue([]);
    const mockHttpService = mock<HttpService>();
    const axiosResponse: AxiosResponse<any> = {
      data: {},
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config: {
        headers: null,
      },
    };
    jest
      .spyOn(mockHttpService, 'get')
      .mockImplementationOnce(() => of(axiosResponse));

    const scanner = createSitemapXmlScanner(mockLogger, input, mockHttpService);
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