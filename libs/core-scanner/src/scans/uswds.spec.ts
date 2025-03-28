import pino from 'pino';
import { mock } from 'jest-mock-extended';

import { browserInstance, newTestPage, newTestPageFromBody } from '../test-helper';
import { createUswdsScanner, buildUswdsResult } from './uswds';
import { UswdsScan } from "../../../../entities/scan-data.entity";


const mockLogger = pino();

describe('Scan: USWDS', () => {

  describe('General Results', () => {

    // todo: This test is too broad and brittle. We should consider slicing this up in a similar way that
    //       .heresHowYouKnowBanner is broken up below. The danger is that each Puppeteer test takes >=2s
    //       to run and we don't want our tests to take too long to execute, so we must take that into
    //       consideration and see if we can reduce/mitigate the cumulative delay.
    it('should return the expected results based on a local mock', async () => {
      await newTestPage(async ({ page, response }) => {
        const scanUswds = createUswdsScanner( () => [], page,
        );
        const result = await scanUswds(pino(), response);
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
          uswdsSemanticVersion: null,
          uswdsVersion: 0,
          heresHowYouKnowBanner: true,
          heresHowYouKnowBanner2: false,
        });
      });
    });

  });

  describe(".heresHowYouKnowBanner", () => {
    it('should return TRUE when the page contains ".usa-banner__button-text" with the appropriate English text contents', async () => {
      const body = `<span class="usa-banner__button-text">Here's how you know</span>`;

      await newUswdsScanResult(
        (result) => {
          expect(result.heresHowYouKnowBanner).toEqual(true);
        },
        body
      );
    });

    it('should return TRUE when the page contains ".usa-banner-button-text" with the appropriate English text contents', async () => {
      const body = `<span class="usa-banner-button-text">Here's how you know</span>`;

      await newUswdsScanResult(
          (result) => {
            expect(result.heresHowYouKnowBanner).toEqual(true);
          },
          body
      );
    });

    it('should return TRUE when the page contains ".usa-banner__button-text" with the appropriate Spanish text contents', async () => {
      const body = `<span class="usa-banner__button-text">Así es como usted puede verificarlo</span>`;

      await newUswdsScanResult(
        (result) => {
          expect(result.heresHowYouKnowBanner).toEqual(true);
        },
        body
      );
    });

    it('should return TRUE when the page contains ".usa-banner-button-text" with the appropriate Spanish text contents', async () => {
      const body = `<span class="usa-banner-button-text">Así es como usted puede verificarlo</span>`;

      await newUswdsScanResult(
          (result) => {
            expect(result.heresHowYouKnowBanner).toEqual(true);
          },
          body
      );
    });

    it('should return FALSE when the page contains ".usa-banner__button-text" but with the wrong contents', async () => {
      const body = `<span class="usa-banner__button-text">The incorrect contents</span>`;

      await newUswdsScanResult(
          (result) => {
            expect(result.heresHowYouKnowBanner).toEqual(false);
          },
          body
      );
    });

    it('should return FALSE when the page contains ".usa-banner-button-text" but with the wrong contents', async () => {
      const body = `<span class="usa-banner-button-text">Other things</span>`;

      await newUswdsScanResult(
          (result) => {
            expect(result.heresHowYouKnowBanner).toEqual(false);
          },
          body
      );
    });

    it('should return FALSE when the page DOES NOT contain any of the appropriate classes', async () => {
      const body = `<span class="something-else">Here's how you know</span>`;

      await newUswdsScanResult(
          (result) => {
            expect(result.heresHowYouKnowBanner).toEqual(false);
          },
          body
      );
    });
  });

  afterAll(async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
  });
});

/**
 * Simple helper function that runs a USWDS scan and returns the results.
 *
 * @param handler
 * @param body
 */
async function newUswdsScanResult(
  handler: (result: UswdsScan) => void,
  body: string,
): Promise<void> {
  await newTestPageFromBody(async ({ page }) => {
    const result = await buildUswdsResult(
      mockLogger,
      [],
      await page.content(),
      page
    );
    handler(result);
  }, body);
}