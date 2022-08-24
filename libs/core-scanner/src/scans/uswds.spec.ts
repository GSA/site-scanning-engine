import { Logger } from 'pino';
import { mock } from 'jest-mock-extended';

import { newTestPage } from '../test-helper';
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
        uswdsString: 103,
        uswdsInlineCss: 2214,
        uswdsUsFlag: 20,
        uswdsStringInCss: 0,
        uswdsUsFlagInCss: 0,
        uswdsPublicSansFont: 0,
        uswdsCount: 2392,
        uswdsSemanticVersion: undefined,
        uswdsVersion: 0,
      });
    });
  });
});
