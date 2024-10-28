import { Logger } from 'pino';
import { getHttpsUrl } from '../../util';
import { CoreInputDto } from '../../core.input.dto';
import { Page } from 'puppeteer';
import { AccessibilityScan } from 'entities/scan-data.entity';
import { AxePuppeteer } from '@axe-core/puppeteer';
import { aggregateResults } from './results-aggregator';
import { createRequestHandlers } from '../../util';

export const createAccessibilityScanner = (
  logger: Logger,
  input: CoreInputDto,
) => {
  logger.info('Starting a11y scan...');


  return async (page: Page): Promise<AccessibilityScan> => {
    createRequestHandlers(page, logger);

    await page.goto(getHttpsUrl(input.url));

    const axeScanResult = await new AxePuppeteer(page).analyze();
    const violationResults = axeScanResult.violations;

    const { resultsSummary, resultsList } = aggregateResults(violationResults);

    const accessibilityResults = Object.keys(resultsSummary).length
      ? JSON.stringify(resultsSummary)
      : null;
    const accessibilityResultsList = resultsList.length
      ? JSON.stringify(resultsList)
      : null;

    return {
      accessibilityResults,
      accessibilityResultsList,
    };
  };
};
