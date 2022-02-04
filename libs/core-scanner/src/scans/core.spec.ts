import { mock } from 'jest-mock-extended';
import { HTTPResponse, Page } from 'puppeteer';

import { newTestPage } from '../test-helper';
import { buildCoreResult } from './core';

describe('core scan', () => {
  it('works', async () => {
    let page: Page;
    let response: HTTPResponse;
    let sourceUrl: string;
    ({ page, response, sourceUrl } = await newTestPage());

    expect(
      buildCoreResult(
        { websiteId: 123, scanId: 'asdf', url: 'https://www.18f.gov' },
        page,
        response,
      ),
    ).toEqual({
      finalUrl: sourceUrl,
      finalUrlBaseDomain: '',
      finalUrlIsLive: false, // status code is "0" (instead of 2xx) when loading local files
      finalUrlMIMEType: 'unknown',
      finalUrlSameDomain: false,
      finalUrlSameWebsite: false,
      finalUrlStatusCode: 0,
      status: 'completed',
      targetUrlBaseDomain: '18f.gov',
      targetUrlRedirects: false,
      website: {
        id: 123,
      },
    });
  });
});
