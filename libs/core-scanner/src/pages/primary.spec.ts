import { mock, MockProxy } from 'jest-mock-extended';
import { Logger } from 'pino';

import { CoreInputDto } from '../core.input.dto';
import { createPrimaryScanner } from './primary';
import { newTestPage } from '../test-helper';

describe('primary scanner', () => {
  let mockLogger: MockProxy<Logger>;

  beforeEach(async () => {
    mockLogger = mock<Logger>();
  });

  it('should return the correct response', async () => {
    await newTestPage(async ({ page }) => {
      const input: CoreInputDto = {
        websiteId: 1,
        url: '18f.gov',
        scanId: '123',
      };
      const scanner = await createPrimaryScanner(mockLogger, input);
      const result = await scanner(page);
      expect(result).toEqual({
        urlScan: {
          targetUrlRedirects: true,
          finalUrl: 'https://18f.gsa.gov/',
          finalUrlWebsite: '18f.gsa.gov',
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
        },
        thirdPartyScan: {
          thirdPartyServiceDomains:
            'dap.digitalgov.gov,fonts.googleapis.com,search.usa.gov,www.google-analytics.com,www.googletagmanager.com',
          thirdPartyServiceCount: 5,
        },
        cookieScan: { domains: '.18f.gsa.gov,.gsa.gov' },
        uswdsScan: {
          usaClasses: 55,
          uswdsString: 8,
          uswdsInlineCss: 0,
          uswdsUsFlag: 20,
          uswdsUsFlagInCss: 0,
          uswdsStringInCss: 20,
          uswdsPublicSansFont: 40,
          uswdsSemanticVersion: '2.9.0',
          uswdsVersion: 100,
          uswdsCount: 243,
        },
        loginScan: { loginDetected: null, loginProvider: null },
        cloudDotGovPagesScan: { cloudDotGovPages: true },
        cmsScan: { cms: null },
        hstsScan: { hsts: true },
        requiredLinksScan: {
          requiredLinksUrl: 'about,foia,privacy,usa.gov',
          requiredLinksText:
            'accessibility,no fear act,foia,inspector general,privacy policy,vulnerability disclosure',
        },
        searchScan: {
          searchDetected: true,
        },
      });
    });
  });
});
