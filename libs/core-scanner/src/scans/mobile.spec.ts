import { mock } from 'jest-mock-extended';
import { Logger } from 'pino';
import { browserInstance, newTestPage } from '../test-helper';
import { buildMobileResult } from './mobile';

describe('mobile scan', () => {
  it('detects a meta element that meets the criteria', async () => {
    await newTestPage(async ({ page }) => {
      expect(await buildMobileResult(mock<Logger>(), page)).toEqual({
        viewportMetaTag: true,
      });
    });
  });

  it('detects when a meta element that meets the criteria is not present', async () => {
    await newTestPage(async ({ page }) => {
      expect(await buildMobileResult(mock<Logger>(), page)).toEqual({
        viewportMetaTag: false,
      });
    }, 'reginfo_gov_dump.mht');
  });

  afterAll(async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
  });
});
