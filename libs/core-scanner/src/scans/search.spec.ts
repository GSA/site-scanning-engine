import { buildSearchResult } from './search';
import { browserInstance, newTestPage } from '../test-helper';
import pino from 'pino';

const mockLogger = pino();

describe('search scan', () => {
  it('detect if a page contains a search form', async () => {
    await newTestPage(async ({ page }) => {
      expect(await buildSearchResult(mockLogger, page)).toEqual({
        searchDetected: true,
        searchgov: true,
      });
    });
  });

  afterAll(async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
  });
});
