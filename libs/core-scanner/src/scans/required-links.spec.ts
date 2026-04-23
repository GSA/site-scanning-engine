import { browserInstance, newTestPage } from '../test-helper';
import { buildRequiredLinksResult } from './required-links';
import pino from 'pino';

const mockLogger = pino();

describe('required links scan', () => {
  it('detects required links strings in href attribute and a element text', async () => {
    await newTestPage(async ({ page }) => {
      expect(await buildRequiredLinksResult(mockLogger, page)).toEqual({
        hyperlinkDomains:
          '18f.gsa.gov,methods.18f.gov,github.com,twitter.com,www.linkedin.com,www.gsa.gov,www.gsaig.gov,www.usa.gov',
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
