import { join } from 'path';
import { Logger } from 'pino';
import * as HTMLCS from 'html_codesniffer';
import { Message } from 'html_codesniffer';
import { getHttpsUrl } from '../util';
import { CoreInputDto } from '../core.input.dto';
import { Page } from 'puppeteer';
import { AccessibilityScan } from 'entities/scan-data.entity';
import { AccessibilityScans } from 'entities/scan-page.entity';

export const createAccessibilityScanner = (
  logger: Logger,
  input: CoreInputDto,
) => {
  return async (page: Page): Promise<AccessibilityScans> => {
    await page.goto(getHttpsUrl(input.url));

    const scriptPath = join(
      __dirname,
      '..',
      '..',
      '..',
      'node_modules',
      'html_codesniffer',
      'build',
      'HTMLCS.js',
    );

    await page.addScriptTag({
      path: scriptPath,
    });

    return {
      accessibilityScan: await buildAccessibilityResult(logger, page),
    };
  };
};

async function buildAccessibilityResult(
  logger: Logger,
  page: Page,
): Promise<AccessibilityScan> {
  try {
    const htmlcsResults = await getHtmlcsResults(logger, page);

    if (!htmlcsResults) {
      throw new Error('html_codesniffer could not run');
    } else {
      return {
        a11yMissingImgAltIssueCount: getIssueTotalByCategory(
          htmlcsResults,
          'WCAG2AA.Principle1.Guideline1_1',
        ),
        a11yHtmlAttributeIssueCount: getIssueTotalByCategory(
          htmlcsResults,
          'WCAG2AA.Principle4.Guideline4_1',
        ),
        a11yColorContrastIssueCount: getIssueTotalByCategory(
          htmlcsResults,
          'WCAG2AA.Principle1.Guideline1_4',
        ),
      };
    }
  } catch (err) {
    logger.warn(`Error running HTMLCS in page: ${err}`);
    throw err;
  }
}

async function getHtmlcsResults(
  logger: Logger,
  page: Page,
): Promise<Message[]> | undefined {
  const htmlcsResults: any = await page.evaluate(() => {
    return new Promise((resolve, reject) => {
      try {
        HTMLCS.process('WCAG2AA', document.documentElement, () => {
          const results = HTMLCS.getMessages();
          resolve(results);
        });
      } catch (err) {
        reject(err);
      }
    });
  });

  return htmlcsResults;
}

function getIssueTotalByCategory(results: any[], category: string): number {
  const HTMLCS_ERROR_CODE = 1;
  return results
    .filter((msg) => msg.type === HTMLCS_ERROR_CODE)
    .filter((msg) => msg.code.includes(category)).length;
}
