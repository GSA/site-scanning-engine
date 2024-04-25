import { browserInstance, newTestPage } from '../test-helper';
import { buildRequiredLinksResult } from './required-links';

describe('required links scan', () => {
  it('detects required links strings in href attribute and a element text', async () => {
    await newTestPage(async ({ page }) => {
      expect(await buildRequiredLinksResult(page)).toEqual({
        requiredLinksUrl: 'about,foia,usa.gov',
        requiredLinksText:
          'accessibility,budget and performance,no fear act,foia,freedom of information act,inspector general,vulnerability disclosure,usa.gov',
      });
    });
  });

  afterAll(async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
  });
});
