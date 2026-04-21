import { Page } from 'puppeteer';
import { FeedbackLinksScan } from 'entities/scan-data.entity';
import { Logger } from 'pino';

export async function buildFeedbackLinksResult(
  parentLogger: Logger,
  page: Page,
): Promise<FeedbackLinksScan> {
  const feedbackLinksResults = await page.evaluate(() => {
    const feedbackLinksTextContents = [
      'feedback',
      'contact',
      'support',
      'help',
      'suggestion',
      'customer-service',
      'tell us what you think',
      'let us know',
      'survey',
    ];

    const feedbackLinksText = feedbackLinksTextContents
      .filter((string) => {
        let stringDetected = false;

        document.querySelectorAll('a').forEach((el) => {
          if (el.textContent.toLowerCase() === string) {
            stringDetected = true;
          }
        });

        return stringDetected;
      })
      .join(',');

    return { feedbackLinksText };
  });

  return feedbackLinksResults;
}
