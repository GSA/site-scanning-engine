import { browserInstance, newTestPage } from '../test-helper';
import { buildUrlScanResult } from './url-scan';
import pino from 'pino';

const mockLogger = pino();

describe('url scan', () => {
  it('works', async () => {
    await newTestPage(async ({ page, response, sourceUrl }) => {
      expect(
        buildUrlScanResult(
          { websiteId: 123, scanId: 'asdf', filter: false, url: 'https://www.18f.gov' },
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
        targetUrlRedirects: false,
      });
    });
  });

  afterAll(async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
  });
});
