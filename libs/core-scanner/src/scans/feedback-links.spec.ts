import { browserInstance, newTestPage } from '../test-helper';
import { buildFeedbackLinksResult } from './feedback-links';
import pino from 'pino';

const mockLogger = pino();

describe('feedback links scan', () => {
  it('detects feedback links strings in href attribute and a element text', async () => {
    await newTestPage(async ({ page }) => {
      expect(await buildFeedbackLinksResult(mockLogger, page)).toEqual({
        feedbackLinksText: '',
      });
    });
  });

  afterAll(async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
  });
});
