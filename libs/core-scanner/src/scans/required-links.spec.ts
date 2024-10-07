import { browserInstance, newTestPage } from '../test-helper';
import { buildRequiredLinksResult } from './required-links';
import pino from 'pino';

const mockLogger = pino();

describe('required links scan', () => {
  it('detects required links strings in href attribute and a element text', async () => {
    await newTestPage(async ({ page }) => {
      expect(await buildRequiredLinksResult(mockLogger, page)).toEqual({
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
