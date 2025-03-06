import { buildCookieResult } from './cookies';
import { browserInstance, newTestPage } from '../test-helper';
import pino from 'pino';

const mockLogger = pino();

describe('cookie scan', () => {
  it('detects if cookies are present', async () => {
    await newTestPage(async ({ page }) => {
      // We make an actual network request to 10x.gsa.gov in this test case,
      // so this is more so an integration test than a unit test per se.
      await page.goto('https://10x.gsa.gov/');

      const result = await buildCookieResult(mockLogger, page);

      expect(result).toEqual({
        domains: '.gsa.gov',
      });
    });
  });

  it('detects if no cookies are present', async () => {
    await newTestPage(async ({ page }) => {
      const result = await buildCookieResult(mockLogger, page);

      expect(result).toEqual({
        domains: '',
      });
    });
  });

  afterAll(async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
  });
});
