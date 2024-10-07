import { Page } from 'puppeteer';

import { RequiredLinksScan } from 'entities/scan-data.entity';

import { Logger } from 'pino';

export async function buildRequiredLinksResult( parentLogger: Logger, page: Page ): Promise<RequiredLinksScan> {
  const requiredLinksResults = await page.evaluate(() => {
    const requiredLinksUrlContents = [
      'about',
      'fear',
      'foia',
      'inspector',
      'privacy',
      'usa.gov',
      'spanish',
      'espanol',
      'español',
      '/es',
    ];

    const requiredLinksUrl = requiredLinksUrlContents
      .filter((string) => {
        let stringDetected = false;

        document.querySelectorAll('a').forEach((el) => {
          const href = el.getAttribute('href');
          if (href && href.toLowerCase().includes(string)) {
            stringDetected = true;
          }
        });

        return stringDetected;
      })
      .join(',');

    const requiredLinksTextContents = [
      'about us',
      'accessibility',
      'budget and performance',
      'no fear act',
      'foia',
      'freedom of information act',
      'inspector general',
      'privacy policy',
      'vulnerability disclosure',
      'usa.gov',
      'espanol',
      'español',
      'espa&ntilde;ol',
      'spanish',
    ];

    const requiredLinksText = requiredLinksTextContents
      .filter((string) => {
        let stringDetected = false;

        document.querySelectorAll('a').forEach((el) => {
          if (el.textContent.toLowerCase().includes(string)) {
            stringDetected = true;
          }
        });

        return stringDetected;
      })
      .join(',');

    return {
      requiredLinksUrl,
      requiredLinksText,
    };
  });

  return requiredLinksResults;
};
