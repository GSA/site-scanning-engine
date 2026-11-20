import {
  browserInstance,
  newTestPage,
  newTestPageFromBody,
} from '../test-helper';
import { buildFeedbackLinksResult } from './feedback-links';
import pino from 'pino';

const mockLogger = pino();

describe('feedback links scan', () => {
  it('detects feedback links strings in href attribute and a element text', async () => {
    await newTestPage(async ({ page }) => {
      expect(await buildFeedbackLinksResult(mockLogger, page)).toEqual({
        feedbackLinksText: 'contact',
      });
    });
  });

  it('detects link text that is surrounded by whitespace', async () => {
    await newTestPageFromBody(async ({ page }) => {
      expect(await buildFeedbackLinksResult(mockLogger, page)).toEqual({
        feedbackLinksText: 'contact',
      });
    }, '<a href="/contact/">\n        Contact\n      </a>');
  });

  it('does not match link text that merely contains a feedback word', async () => {
    await newTestPageFromBody(async ({ page }) => {
      expect(await buildFeedbackLinksResult(mockLogger, page)).toEqual({
        feedbackLinksText: '',
      });
    }, '<a href="/contact/">Contact your representative</a>');
  });

  afterAll(async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
  });
});
