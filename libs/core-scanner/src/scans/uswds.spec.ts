import { Logger } from 'pino';
import { mock } from 'jest-mock-extended';
import { HTTPResponse, Page } from 'puppeteer';

import { newTestPage } from '../test-helper';
import { createUswdsScanner } from './uswds';

describe('uswds scan', () => {
  let page: Page;
  let response: HTTPResponse;
  beforeAll(async () => {
    ({ page, response } = await newTestPage());
  });

  it('works', async () => {
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
      uswdsString: 103,
      uswdsTables: 0,
      uswdsInlineCss: 2214,
      uswdsUsFlag: 20,
      uswdsStringInCss: 0,
      uswdsUsFlagInCss: 0,
      uswdsMerriweatherFont: 0,
      uswdsPublicSansFont: 0,
      uswdsSourceSansFont: 0,
      uswdsCount: 2392,
      uswdsSemanticVersion: undefined,
      uswdsVersion: 0,
    });
  });
});
