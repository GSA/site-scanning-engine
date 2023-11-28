import { join } from 'path';
import { Logger } from 'pino';
import * as HTMLCS from 'html_codesniffer';
import { getHttpsUrl } from '../util';
import { CoreInputDto } from '../core.input.dto';
import { Page } from 'puppeteer';
import { AccessibilityScan } from 'entities/scan-data.entity';
import { Message } from 'html_codesniffer';

export const createAccessibilityScanner = (
  logger: Logger,
  input: CoreInputDto,
) => {
  return async (page: Page): Promise<AccessibilityScan> => {
    page.on('console', (message) => console.log('PAGE LOG:', message.text()));
    page.on('error', (error) => console.log('ERROR LOG:', error));
    await page.goto(getHttpsUrl(input.url));
    const pageWithScript = await addHTMLCScriptTag(logger, page);

    const htmlcsResults =
      (await getHtmlcsResults(logger, pageWithScript)) ?? [];

    let a11yMissingImgAltIssues = null;
    let a11yHtmlAttributeIssues = null;
    let a11yColorContrastIssues = null;

    if (htmlcsResults) {
      const HTMLCS_ERROR_CODE = 1;

      a11yMissingImgAltIssues = getIssueTotalByCategory(
        htmlcsResults,
        'WCAG2AA.Principle1.Guideline1_1',
        HTMLCS_ERROR_CODE,
      );
      a11yHtmlAttributeIssues = getIssueTotalByCategory(
        htmlcsResults,
        'WCAG2AA.Principle4.Guideline4_1',
        HTMLCS_ERROR_CODE,
      );
      a11yColorContrastIssues = getIssueTotalByCategory(
        htmlcsResults,
        'WCAG2AA.Principle1.Guideline1_4',
        HTMLCS_ERROR_CODE,
      );
    }

    return {
      a11yMissingImgAltIssues,
      a11yHtmlAttributeIssues,
      a11yColorContrastIssues,
    };
  };
};

async function addHTMLCScriptTag(logger: Logger, page: Page): Promise<Page> {
  try {
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
    await page.addScriptTag({ path: scriptPath });

    const isHTMLCSLoaded = await page.evaluate(() => {
      return typeof HTMLCS !== 'undefined';
    });

    if (!isHTMLCSLoaded) {
      throw new Error('HTMLCS script not loaded properly');
    }

    return page;
  } catch (err) {
    logger.warn(`Error adding HTMLCS script tag: ${err.message}`);
    throw err;
  }
}

async function getHtmlcsResults(
  logger: Logger,
  page: Page,
): Promise<Message[] | undefined> {
  try {
    return (await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        HTMLCS.process('WCAG2AA', document.documentElement, () => {
          try {
            resolve(HTMLCS.getMessages());
          } catch (err) {
            reject(err);
          }
        });
      });
    })) as Message[];
  } catch (err) {
    logger.warn(`Error in HTMLCS process: ${err.message}`);
    throw err;
  }
}

function getIssueTotalByCategory(
  results: Message[],
  category: string,
  errorCode: number,
): number {
  return results.filter(
    (msg) => msg.type === errorCode && msg.code.includes(category),
  ).length;
}
