import { buildSearchResult } from './search';
import { newTestPage } from '../test-helper';

describe('search scan', () => {
  it('detect if a page contains a search form', async () => {
    await newTestPage(async ({ page }) => {
      expect(await buildSearchResult(page)).toEqual({
        searchDetected: true,
      });
    });
  });
});
