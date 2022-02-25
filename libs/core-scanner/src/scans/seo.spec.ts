import { mock } from 'jest-mock-extended';
import { Logger } from 'pino';

import { newTestPage } from '../test-helper';
import { buildSeoResult } from './seo';

describe('seo scan', () => {
  it('works', async () => {
    await newTestPage(async ({ page }) => {
      const result = await buildSeoResult(mock<Logger>(), page);
      expect(result).toEqual({
        mainElementFinalUrl: true,
        ogArticleModifiedFinalUrl: undefined,
        ogArticlePublishedFinalUrl: undefined,
        ogDescriptionFinalUrl:
          'Appalachian Regional Commission The Appalachian Regional Commission (ARC) is an economic development partnership agency of the federal government and 13 state governments focusing on 423 counties across the Appalachian Region. ARC’s mission is to innovate, partner, and invest to build community capacity and strengthen economic growth in Appalachia. Research and Resources Available Opportunities In The […]',
        ogTitleFinalUrl:
          "Investing in Appalachia's economic future. - Appalachian Regional Commission",
      });
    }, 'arc_gov_dump.mht');
  });
});
