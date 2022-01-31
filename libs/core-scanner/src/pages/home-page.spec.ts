import { Logger } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { Page, HTTPRequest, HTTPResponse } from 'puppeteer';

import { Website } from 'entities/website.entity';

import { CoreInputDto } from '../core.input.dto';
import { ScanStatus } from '../scan-status';
import { createHomePageScanner } from './home-page';
import { source } from './test-page-source';

describe('home page scanner', () => {
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

    mockPage.evaluate.mockResolvedValueOnce('Page Title');
    mockPage.evaluate.mockResolvedValueOnce('Page Description');
    mockPage.evaluate.mockResolvedValueOnce(time.toString());
    mockPage.evaluate.mockResolvedValueOnce(time.toString());
    mockPage.evaluate.mockResolvedValueOnce(true);
    mockPage.evaluate.mockResolvedValueOnce(4);

    mockResponse.text.mockResolvedValue(source);
    mockResponse.url.mockReturnValue('https://18f.gsa.gov');
    mockPage.goto.mockResolvedValue(mockResponse);
    redirectRequest.redirectChain.mockReturnValue([]);

    const scanner = createHomePageScanner(mockLogger, input);
    const result = await scanner(mockPage);

    expect(result).toEqual({
      coreResults: {
        finalUrl: 'https://18f.gsa.gov',
        finalUrlBaseDomain: 'gsa.gov',
        finalUrlIsLive: true,
        finalUrlMIMEType: 'text/html',
        finalUrlSameDomain: false,
        finalUrlSameWebsite: false,
        finalUrlStatusCode: 200,
        status: 'completed',
        targetUrlBaseDomain: '18f.gov',
        targetUrlRedirects: true,
        website: {
          id: 1,
        },
      },
      solutionsResults: {
        website: website,
        usaClasses: 4,
        uswdsString: 1,
        uswdsTables: 0,
        uswdsInlineCss: 0,
        uswdsUsFlag: 20,
        uswdsStringInCss: 0,
        uswdsUsFlagInCss: 0,
        uswdsMerriweatherFont: 0,
        uswdsPublicSansFont: 0,
        uswdsSourceSansFont: 0,
        uswdsCount: 25,
        uswdsSemanticVersion: undefined,
        uswdsVersion: 0,
        dapDetected: false,
        dapParameters: undefined,
        ogTitleFinalUrl: 'Page Title',
        ogDescriptionFinalUrl: 'Page Description',
        ogArticlePublishedFinalUrl: time,
        ogArticleModifiedFinalUrl: time,
        mainElementFinalUrl: true,
        thirdPartyServiceDomains: '',
        thirdPartyServiceCount: 0,
        status: ScanStatus.Completed,
      },
    });
  });
});
