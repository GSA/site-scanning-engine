import pino from 'pino';

import { CoreInputDto } from '../core.input.dto';
import { browserInstance, newTestPage } from '../test-helper';
import * as util from '../util';
import { createPrimaryScanner } from './primary';

const input: CoreInputDto = {
  websiteId: 1,
  url: '18f.gov',
  filter: false,
  pageviews: 1,
  visits: 1,
  scanId: '123',
};

describe('primary scanner', () => {
  it('runs the complete primary scan pipeline against the checked-in fixture', async () => {
    await newTestPage(async ({ page, response, sourceUrl }) => {
      const goto = jest.spyOn(page, 'goto').mockResolvedValue(response);
      const scanner = createPrimaryScanner(pino(), input);

      const result = await scanner(page);

      expect(goto).toHaveBeenCalledWith('https://18f.gov', {
        waitUntil: 'networkidle2',
      });
      expect(result).toEqual(
        expect.objectContaining({
          urlScan: expect.objectContaining({
            finalUrl: sourceUrl,
            finalUrlMIMEType: 'multipart/related',
            finalUrlIsLive: true,
            finalUrlStatusCode: 200,
          }),
        }),
      );
      expect(Object.keys(result).sort()).toEqual([
        'cmsScan',
        'cookieScan',
        'dapScan',
        'feedbackLinksScan',
        'loginScan',
        'mobileScan',
        'requiredLinksScan',
        'searchScan',
        'seoScan',
        'thirdPartyScan',
        'toolingScan',
        'urlScan',
        'uswdsScan',
      ]);
    });
  });

  it('handles a null navigation response without rejecting', async () => {
    await newTestPage(async ({ page }) => {
      jest.spyOn(page, 'goto').mockResolvedValue(null);
      const scanner = createPrimaryScanner(pino(), input);

      const result = await scanner(page);

      expect(result).toEqual(
        expect.objectContaining({
          urlScan: expect.objectContaining({
            finalUrlStatusCode: null,
            finalUrlMIMEType: 'none-specified',
            finalUrlIsLive: false,
          }),
        }),
      );
    });
  });

  it('continues the primary scan when URL scan construction fails', async () => {
    await newTestPage(async ({ page, response }) => {
      jest.spyOn(page, 'goto').mockResolvedValue(response);
      jest
        .spyOn(util, 'getPageMd5Hash')
        .mockRejectedValueOnce(new Error('unable to hash page'));
      const scanner = createPrimaryScanner(pino(), input);

      const result = await scanner(page);

      expect(result.urlScan).toBeNull();
      expect(result.dapScan).not.toBeNull();
      expect(result.seoScan).not.toBeNull();
    });
  });

  afterAll(async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
  });
});
