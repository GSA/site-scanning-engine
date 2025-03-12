import { mock, MockProxy } from 'jest-mock-extended';
import { Logger } from 'pino';

import { CoreInputDto } from '../core.input.dto';
import { createPrimaryScanner } from './primary';
import { browserInstance, newTestPage } from '../test-helper';

/**
 * Disabled because this suite is brittle and based on external factors.
 * todo: Consider how we can get the coverage this test provides without
 *       the drawbacks apparent in this approach.
 */
describe.skip('primary scanner', () => {
  let mockLogger: MockProxy<Logger>;

  beforeEach(async () => {
    mockLogger = mock<Logger>();
  });

  it('should return the correct response', async () => {
    await newTestPage(async ({ page }) => {
      // We make an actual network request to 18f.gov in this test case,
      // so this is more so an integration test than a unit test per se.
      const input: CoreInputDto = {
        websiteId: 1,
        url: '18f.gov',
        filter: false,
        pageviews: 1,
        visits: 1,
        scanId: '123',
      };
      const scanner = await createPrimaryScanner(mockLogger, input);
      const result = await scanner(page);
      expect(result).toMatchObject({
        urlScan: {
          targetUrlRedirects: true,
          finalUrl: 'https://18f.gsa.gov/',
          finalUrlWebsite: '18f.gsa.gov',
          finalUrlTopLevelDomain: 'gov',
          finalUrlMIMEType: 'text/html',
          finalUrlIsLive: true,
          finalUrlBaseDomain: 'gsa.gov',
          finalUrlSameDomain: false,
          finalUrlSameWebsite: false,
          finalUrlStatusCode: 200,
        },
        dapScan: {
          dapDetected: true,
          dapParameters: 'agency=GSA&subagency=TTS%2C18F',
        },
        seoScan: {
          ogTitleFinalUrl: '18F: Digital service delivery | Home',
          ogDescriptionFinalUrl:
            '18F builds effective, user-centric digital services focused on the interaction between government and the people and businesses it serves.',
          mainElementFinalUrl: true,
          canonicalLink: 'https://18f.gsa.gov/',
          pageTitle: '18F: Digital service delivery | Home',
          metaDescriptionContent:
            '18F builds effective, user-centric digital services focused on the interaction between government and the people and businesses it serves.',
          hrefLangContent: '',
          htmlLangContent: 'en-US',
          metaKeywordsContent: null,
          ogImageContent: 'https://18f.gsa.gov/assets/img/logos/18F-Logo-M.png',
          ogTypeContent: null,
          ogUrlContent: null,
          // Experimental Fields #1368 Feb 2025
          dcDateContent: null,
          dcDateCreatedContent: null,
          dctermsCreatedContent: null,
          revisedContent: null,
          lastModifiedContent: null,
          dateContent: null,
        },
        thirdPartyScan: {
          thirdPartyServiceDomains:
            'dap.digitalgov.gov,search.usa.gov,www.google-analytics.com,www.googletagmanager.com',
          thirdPartyServiceCount: 4,
        },
        cookieScan: { domains: '.gsa.gov' },
        uswdsScan: {
          usaClasses: 50,
          usaClassesUsed:
            'usa-accordion,usa-banner,usa-button,usa-card,usa-card-group,usa-header,usa-identifier,usa-link,usa-list,usa-logo,usa-logo-img,usa-menu-btn,usa-nav,usa-nav-container,usa-navbar,usa-overlay,usa-section,usa-skipnav',
          uswdsString: 7,
          uswdsInlineCss: 0,
          uswdsUsFlag: 20,
          uswdsUsFlagInCss: 0,
          uswdsStringInCss: 20,
          uswdsPublicSansFont: 0,
          uswdsSemanticVersion: 'v3.8.0',
          uswdsVersion: 100,
          uswdsCount: 197,
        },
        loginScan: { loginDetected: null, loginProvider: null },
        cmsScan: { cms: 'cloud.gov Pages' },
        requiredLinksScan: {
          requiredLinksUrl: 'about,foia,privacy,usa.gov',
          requiredLinksText:
            'accessibility,no fear act,foia,inspector general,privacy policy,vulnerability disclosure,usa.gov',
        },
        searchScan: {
          searchDetected: false,
          searchgov: null,
        },
        mobileScan: {
          viewportMetaTag: true,
        },
      });
    });
  });

  afterAll(async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
  });
});
