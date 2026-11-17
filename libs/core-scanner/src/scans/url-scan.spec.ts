import { browserInstance, newTestPage } from '../test-helper';
import {
  buildUrlScanResult,
  logUrlResponseDivergence,
  URL_RESPONSE_DIVERGENCE_METRIC_ID,
  URL_RESPONSE_DIVERGENCE_MESSAGE,
} from './url-scan';
import pino, { Logger } from 'pino';
import { mock } from 'jest-mock-extended';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';

const mockLogger = pino();

const input: CoreInputDto = {
  websiteId: 123,
  scanId: 'asdf',
  filter: false,
  pageviews: 1,
  visits: 1,
  url: 'https://www.18f.gov',
};

describe('url scan', () => {
  describe('logUrlResponseDivergence', () => {
    it('does not log when the page and response URLs match', () => {
      const logger = mock<Logger>();

      logUrlResponseDivergence(
        logger,
        'https://example.gov/final',
        'https://example.gov/final',
      );

      expect(logger.info).not.toHaveBeenCalled();
    });

    it.each([
      ['page', undefined, 'https://a.gov/'],
      ['response', 'https://a.gov/', undefined],
    ])('does not log when the %s URL is unavailable', (_, pageUrl, responseUrl) => {
      const logger = mock<Logger>();

      logUrlResponseDivergence(logger, pageUrl, responseUrl);

      expect(logger.info).not.toHaveBeenCalled();
    });

    it('logs a count when the page and response URLs differ', () => {
      const logger = mock<Logger>();
      const pageUrl = 'https://example.gov/redirected';
      const responseUrl = 'https://example.gov/initial';

      logUrlResponseDivergence(logger, pageUrl, responseUrl);

      expect(logger.info).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        {
          pageUrl,
          responseUrl,
          metricId: URL_RESPONSE_DIVERGENCE_METRIC_ID,
          metricUnit: 'count',
          metricValue: 1,
        },
        URL_RESPONSE_DIVERGENCE_MESSAGE,
      );
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  it('works', async () => {
    await newTestPage(async ({ page, response, sourceUrl }) => {
      expect(
        await buildUrlScanResult(input, page, response, mockLogger),
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
        finalUrlPageHash: '005ffef54e0acba5fe1b2f672c6be895', // pragma: allowlist secret
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
