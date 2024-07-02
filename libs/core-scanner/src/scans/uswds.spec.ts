import { Logger } from 'pino';
import { mock } from 'jest-mock-extended';

import { browserInstance, newTestPage } from '../test-helper';
import { createUswdsScanner } from './uswds';

describe('uswds scan', () => {
  it('works', async () => {
    await newTestPage(async ({ page, response }) => {
      const scanUswds = createUswdsScanner(
        {
          logger: mock<Logger>(),
          getCSSRequests: () => [],
        },
        page,
      );
      const result = await scanUswds(response);
      expect(result).toEqual({
        usaClasses: 55,
        usaClassesUsed:
          'usa-accordion,usa-banner,usa-button,usa-card,usa-card-group,usa-footer,usa-header,usa-hero,usa-identifier,usa-input,usa-link,usa-logo,usa-logo-img,usa-media-block,usa-menu-btn,usa-nav,usa-nav-container,usa-navbar,usa-overlay,usa-search,usa-section,usa-skipnav,usa-social-link,usa-sr-only',
        uswdsString: 103,
        uswdsInlineCss: 2214,
        uswdsUsFlag: 20,
        uswdsStringInCss: 0,
        uswdsUsFlagInCss: 0,
        uswdsPublicSansFont: 0,
        uswdsCount: 2392,
        uswdsSemanticVersion: undefined,
        uswdsVersion: 0,
        heresHowYouKnowBanner: true,
      });
    });
  });

  afterAll(async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
  });
});
