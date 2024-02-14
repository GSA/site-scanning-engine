import { Logger } from 'pino';
import { getHttpsUrl } from '../util';
import { CoreInputDto } from '../core.input.dto';
import { Page } from 'puppeteer';
import { AccessibilityScan } from 'entities/scan-data.entity';
import { AxePuppeteer } from '@axe-core/puppeteer';
import { writeFile } from 'fs';

export const createAccessibilityScanner = (
  logger: Logger,
  input: CoreInputDto,
) => {
  logger.info('Starting a11y scan...');

  return async (page: Page): Promise<AccessibilityScan> => {
    page.on('console', (message) => console.log('PAGE LOG:', message.text()));
    page.on('error', (error) => console.log('ERROR LOG:', error));

    await page.goto(getHttpsUrl(input.url));

    const results = await new AxePuppeteer(page).analyze();
    const resultsJson = JSON.stringify(results, null, 2);

    writeFile('accessibilityResults.json', resultsJson, 'utf8', (err) => {
      if (err) {
        console.error('An error occurred:', err);
      } else {
        console.log('Accessibility results saved to accessibilityResults.json');
      }
    });

    return {
      a11yMissingImgAltIssues: 0,
      a11yHtmlAttributeIssues: 0,
      a11yColorContrastIssues: 0,
    };
  };
};
