import { mock, MockProxy } from 'jest-mock-extended';
import { Logger } from 'pino';
import { Page, HTTPRequest, HTTPResponse } from 'puppeteer';

import { Website } from 'entities/website.entity';

import { CoreInputDto } from '../core.input.dto';
import { createPrimaryScanner } from './primary';
import { source } from './test-page-source';

describe('primary scanner', () => {
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

  it('should return the correct response', async () => {
    const input: CoreInputDto = {
      websiteId: 1,
      url: '18f.gov',
      scanId: '123',
    };

    const time = new Date('2018-09-15T15:53:00');

    const website = new Website();
    website.id = input.websiteId;

    mockPage.evaluate.mockResolvedValueOnce('Page Title'); // 1. og:title
    mockPage.evaluate.mockResolvedValueOnce(4); // 2. undefined
    mockPage.evaluate.mockResolvedValueOnce('Page Description'); // 3. og:description
    mockPage.evaluate.mockResolvedValueOnce(time.toString()); // 4. article:published_date
    mockPage.evaluate.mockResolvedValueOnce(time.toString()); // 5. article:modified_date
    mockPage.evaluate.mockResolvedValueOnce(true); // 6. undefined

    mockResponse.text.mockResolvedValue(source);
    mockResponse.url.mockReturnValue('https://18f.gsa.gov');
    mockPage.goto.mockResolvedValue(mockResponse);
    redirectRequest.redirectChain.mockReturnValue([]);

    const scanner = createPrimaryScanner(mockLogger, input);
    const result = await scanner(mockPage);

    expect(result).toEqual({
      dapScan: {
        dapDetected: false,
        dapParameters: undefined,
      },
      loginScan: {
        loginDetected: null,
      },
      seoScan: {
        mainElementFinalUrl: true,
        ogArticleModifiedFinalUrl: time,
        ogArticlePublishedFinalUrl: time,
        ogDescriptionFinalUrl: 'Page Description',
        ogTitleFinalUrl: 'Page Title',
      },
      thirdPartyScan: {
        thirdPartyServiceCount: 0,
        thirdPartyServiceDomains: '',
      },
      urlScan: {
        finalUrl: 'https://18f.gsa.gov',
        finalUrlBaseDomain: 'gsa.gov',
        finalUrlIsLive: true,
        finalUrlMIMEType: 'text/html',
        finalUrlSameDomain: false,
        finalUrlSameWebsite: false,
        finalUrlStatusCode: 200,
        targetUrlRedirects: true,
      },
      uswdsScan: {
        usaClasses: 4,
        uswdsCount: 25,
        uswdsInlineCss: 0,
        uswdsPublicSansFont: 0,
        uswdsSemanticVersion: undefined,
        uswdsString: 1,
        uswdsStringInCss: 0,
        uswdsUsFlag: 20,
        uswdsUsFlagInCss: 0,
        uswdsVersion: 0,
      },
    });
  });
});
