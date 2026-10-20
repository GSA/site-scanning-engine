import pino from 'pino';

import { CoreInputDto } from '../core.input.dto';
import { browserInstance, newTestPage } from '../test-helper';
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

  afterAll(async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
  });
});
