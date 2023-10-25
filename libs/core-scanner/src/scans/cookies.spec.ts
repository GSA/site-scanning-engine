import { buildCookieResult } from './cookies';
import { browserInstance, newTestPage } from '../test-helper';

describe('cookie scan', () => {
  it('non-navigation different domains treated as third-parties', async () => {
    await newTestPage(async ({ page }) => {
      expect(await buildCookieResult(page)).toEqual({
        // I'm not sure the best way to test this; MHT files don't include
        // simulated cookie requests, so we just end up with empty results.
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
