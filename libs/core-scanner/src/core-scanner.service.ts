import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Logger } from 'pino';
import { Browser } from 'puppeteer';

import { BrowserService } from '@app/browser';
import { SecurityDataService } from '@app/security-data';

import { AnyFailureStatus, parseBrowserError, ScanStatus } from 'entities/scan-status';
import { Scanner } from 'libs/scanner.interface';

import { CoreInputDto } from './core.input.dto';
import * as pages from './pages';
import { Page } from './pages';
import { PageScan, PageScanFailure, PageScanSuccess } from 'entities/scan-page.entity';
import { getBaseDomain, getHttpsUrl } from './util';
import { CoreResultPages } from 'entities/core-result.entity';
import { logCount, logTimer } from "../../logging/src/metric-utils";
import { DurationLogTimer } from "../../logging/src";
import { logRunningProcesses, printMemoryUsage } from './util';

@Injectable()
export class CoreScannerService
  implements Scanner<CoreInputDto, CoreResultPages> {
  constructor(
    private browserService: BrowserService,
    private httpService: HttpService,
    private securityDataService: SecurityDataService,
    @InjectPinoLogger(CoreScannerService.name)
    private readonly logger: PinoLogger,
  ) {
  }

  async scan(input: CoreInputDto): Promise<CoreResultPages> {
    const scanLogger = this.initScanLogger(input);

    logRunningProcesses(scanLogger, 'start');
    printMemoryUsage(scanLogger, {scanStage: 'start'});

    const timer = logTimer(scanLogger);
    scanLogger.info(`Starting scan for ${input.url}`);

    if (input.page) {
      scanLogger.warn(`Page filtering enabled! Only '${input.page}' will be executed. This should never be used in production!`);
    }

    if (input.scan) {
      scanLogger.warn(`Scan filtering enabled! Only '${input.scan}' will be executed. This should never be used in production!`);
    }

    scanLogger.info('Calling browser service to start scan...');
    return await this.browserService.useBrowser(async (browser) => {
      const result = this.initResultObject(input);

      // Iterate over the Page enum and run the scan for each page vis this.runPage()
      scanLogger.info('Running scans for all pages...');
      for (const page in Page) {
        scanLogger.info(`Running scan for page '${Page[page]}'...`);
        if (Object.prototype.hasOwnProperty.call(Page, page)) {
          const pageName = Page[page];
          result[pageName] = await this.runPage(pageName, input, scanLogger, browser);
        }
      }

      this.logCoreScannerCompletion(timer, input, scanLogger);
      logRunningProcesses(scanLogger, 'end');
      printMemoryUsage(scanLogger, {scanStage: 'end'});
      return result as CoreResultPages;
    });
  }

  private initScanLogger(input: CoreInputDto): Logger {
    return this.logger.logger.child({
      sseContext: 'CoreScannerService',
      scanId: input.scanId,
      scanUrl: input.url,
      sseUrl: input.url,
      websiteId: input.websiteId,
    });
  }

  private initResultObject(input: CoreInputDto): Partial<CoreResultPages> {
    return {
      base: {
        targetUrlBaseDomain: getBaseDomain(getHttpsUrl(input.url)),
      }
    };
  }

  private shouldRunPage(page: string, input: CoreInputDto, pageLogger: Logger): boolean {
    if (!input.page) {
      return true;
    }
    if (page.toLowerCase().includes(input.page.toLowerCase())) {
      pageLogger.info(`Page '${page}' includes page filter '${input.page}'; running page.`);
      return true;
    }
    pageLogger.warn(`Page '${page}' does not include page filter '${input.page}'; skipping page.`);
  }

  private createSkippedResult(): PageScanFailure {
    return {
      status: ScanStatus.Skipped,
      error: 'This page was skipped by input parameters',
    }
  }

  private createErrorResult(error: Error, input: CoreInputDto, logger: Logger): PageScanFailure {
    return {
      error: error.message,
      status: this.getScanStatus(error, input.url, logger),
    };
  }

  private createSuccessResult(result: any): PageScanSuccess<any> {
    return {
      status: ScanStatus.Completed,
      result,
    };
  }

  private initPageLogger(page: Page, scanLogger: Logger): Logger {
    return scanLogger.child({
      sseContext: `Page.${page}`,
      page
    });
  }

  private async runPage(page: Page, input: CoreInputDto, scanLogger: Logger, browser: Browser): Promise<PageScan<any>> {
    const pageLogger = this.initPageLogger(page, scanLogger);

    if (!this.shouldRunPage(page, input, pageLogger)) {
      return this.createSkippedResult();
    }

    const timer = logTimer(pageLogger);
    pageLogger.info(`Executing '${page}' page...`);

    try {
      const pageResult = await this.getPageResult(page, input, pageLogger, browser);
      this.logPageSuccess(timer, page, input, pageLogger);
      return this.createSuccessResult(pageResult);
    } catch (error) {
      this.logPageFailure(timer, page, input, pageLogger, error);
      return this.createErrorResult(error, input, pageLogger);
    }
  }

  private logPageSuccess(timer: DurationLogTimer, page: Page, input: CoreInputDto, pageLogger: Logger): void {
    timer.log({}, `scanner.page.${page}.overall.duration.total`, `Page '${page}' completed successfully for site '${input.url}' in [{metricValue}ms]`);
    logCount(pageLogger, {}, `scanner.page.${page}.succeeded.count`, `Counting successful page '${page}' completion for site '${input.url}'.`);
  }

  private logPageFailure(timer: DurationLogTimer, page: Page, input: CoreInputDto, pageLogger: Logger, error: Error): void {
    timer.log({}, `scanner.page.${page}.overall.duration.total`, `Page '${page}' failed for site '${input.url}' after [{metricValue}ms]`);
    logCount(pageLogger, {}, `scanner.page.${page}.failed.count`, `Counting page '${page}' failure for site '${input.url}'.`);
    pageLogger.error({error}, `Error running '${page}' page: ${error.message}`);
  }

  private logCoreScannerCompletion(timer: DurationLogTimer, input: CoreInputDto, scanLogger: Logger): void {
    timer.log({}, 'scanner.core.site.duration.total', `Scan completed for site '${input.url}' in [{metricValue}ms]`);
    logCount(scanLogger, {}, 'scanner.core.site.scanned.count', `Counting successful scan completion for site '${input.url}'.`);
  }

  private async getPageResult(page: Page, input: CoreInputDto, pageLogger: Logger, browser: Browser): Promise<any> {
    switch (page) {
      case Page.NOT_FOUND:
        return {
          notFoundScan: {
            targetUrl404Test: await pages.createNotFoundScanner(
              this.httpService,
              input.url,
            ),
          },
        };

      case Page.PRIMARY:
        return this.browserService.processPage(
          browser,
          pages.createPrimaryScanner(pageLogger, input),
        );

      case Page.ROBOTS_TXT:
        return this.browserService.processPage(
          browser,
          pages.createRobotsTxtScanner(
            pageLogger,
            input,
          ),
        );

      case Page.SITEMAP_XML:
        return this.browserService.processPage(
          browser,
          pages.createSitemapXmlScanner(
            pageLogger,
            input,
            this.httpService,
          ),
        );

      case Page.DNS:
        return {
          dnsScan: await pages.dnsScan(pageLogger, input.url)
        };

      case Page.ACCESSIBILITY:
        return {
          accessibilityScan: await this.browserService.processPage(
            browser,
            pages.createAccessibilityScanner(
              pageLogger,
              input,
            ),
          ),
        };

      case Page.PERFORMANCE:
        return {
          performanceScan: await this.browserService.processPage(
            browser,
            pages.createPerformanceScanner(
              pageLogger,
              input,
            ),
          ),
        };

      case Page.SECURITY:
        return await this.securityDataService.getSecurityResults(input.url);

      case Page.WWW:
        return await this.browserService.processPage(
            browser,
            pages.createWwwScanner(
              pageLogger,
              input,
            ),
          );

    }
  }

  private getScanStatus(error: Error, url: string, logger: Logger): AnyFailureStatus {
    const scanStatus = parseBrowserError(error);
    if (scanStatus === ScanStatus.UnknownError) {
      logger.warn(`Unknown Error calling ${url}: ${error.message}`);
    }
    logCount(logger, {}, `scanner.core.status.error.${scanStatus}.count`, `Counting failed Scan Status ('${scanStatus}') for site '${url}'.`);
    return scanStatus;
  }
}
