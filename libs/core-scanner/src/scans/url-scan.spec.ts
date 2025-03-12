import { browserInstance, newTestPage } from '../test-helper';
import { buildUrlScanResult } from './url-scan';
import pino from 'pino';

const mockLogger = pino();

describe('url scan', () => {
  it('works', async () => {
    await newTestPage(async ({ page, response, sourceUrl }) => {
      expect(
        await buildUrlScanResult(
          { websiteId: 123, scanId: 'asdf', filter: false, pageviews: 1, visits: 1, url: 'https://www.18f.gov' },
          page,
          response,
          mockLogger,
        ),
      ).toEqual({
        finalUrl: sourceUrl,
        finalUrlBaseDomain: '',
        finalUrlWebsite: null,
        finalUrlTopLevelDomain: 'file',
        finalUrlIsLive: true,
        finalUrlMIMEType: 'multipart/related',
        finalUrlSameDomain: false,
        finalUrlSameWebsite: false,
        finalUrlStatusCode: 200,
        finalUrlPageHash: '005ffef54e0acba5fe1b2f672c6be895',
        targetUrlRedirects: null,
      });
    });
  });

  afterAll(async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
  });
});
