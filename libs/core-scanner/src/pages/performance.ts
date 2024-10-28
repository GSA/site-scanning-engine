import { Logger } from 'pino';
import { getHttpsUrl, createRequestHandlers } from '../util';
import { CoreInputDto } from '../core.input.dto';
import { Page } from 'puppeteer';
import { PerformanceScan } from 'entities/scan-data.entity';

export const createPerformanceScanner = (
  logger: Logger,
  input: CoreInputDto,
) => {
  logger.info('Starting performance scan...');

  return async (page: Page): Promise<PerformanceScan> => {
    createRequestHandlers(page, logger);
    // Inject functions into the page to calculate performance metrics
    await page.evaluateOnNewDocument(calculateLargestContentfulPaint);
    await page.evaluateOnNewDocument(calculateCumulativeLayoutShift);

    await page.goto(getHttpsUrl(input.url), { waitUntil: 'networkidle2' });

    const { largestContentfulPaint, cumulativeLayoutShift } =
      await getPerformanceMetrics(page);

    logger.info(
      `Performance scan results: LCP=${largestContentfulPaint}, CLS=${cumulativeLayoutShift}`,
    );

    return { largestContentfulPaint, cumulativeLayoutShift };
  };
};

// Extend the global Window interface to include custom web performance metrics.
declare global {
  interface Window {
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
  }
}

/**
 * Modeled after:
 * https://github.com/addyosmani/puppeteer-webperf/blob/master/largest-contentful-paint.js
 *
 * Calculates a numeric value representing the render time (in milliseconds) of
 * the largest content element in the viewport.
 */
function calculateLargestContentfulPaint(): void {
  window.largestContentfulPaint = 0;

  const observer = new PerformanceObserver((list) => {
    // Extend the PerformanceEntry interface to access LCP-specific properties.
    interface LargestContentfulPaintEntry extends PerformanceEntry {
      renderTime?: number;
      loadTime?: number;
    }

    const entries = list.getEntries() as LargestContentfulPaintEntry[];
    const lastEntry = entries[entries.length - 1];
    window.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
  });

  observer.observe({ type: 'largest-contentful-paint', buffered: true });
}

/**
 * Modeled after:
 * https://github.com/addyosmani/puppeteer-webperf/blob/master/cumulative-layout-shift.js
 *
 * Calculates a numeric value measuring the sum of all individual layout shift
 * scores for unexpected layout shifts.
 */
function calculateCumulativeLayoutShift(): void {
  window.cumulativeLayoutShift = 0;

  const observer = new PerformanceObserver((list) => {
    // Extend the PerformanceEntry interface to access CLS-specific properties.
    interface LayoutShiftEntry extends PerformanceEntry {
      hadRecentInput: boolean;
      value: number;
    }

    for (const entry of list.getEntries() as LayoutShiftEntry[]) {
      if (!entry.hadRecentInput) {
        window.cumulativeLayoutShift += entry.value;
      }
    }
  });

  observer.observe({ type: 'layout-shift', buffered: true });
}

// Retrieve performance metrics from the page's global namespace
async function getPerformanceMetrics(page: Page): Promise<PerformanceScan> {
  return await page.evaluate(() => {
    return {
      largestContentfulPaint: window.largestContentfulPaint,
      cumulativeLayoutShift: window.cumulativeLayoutShift,
    };
  });
}
