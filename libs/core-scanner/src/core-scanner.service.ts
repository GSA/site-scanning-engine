import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { Logger } from 'pino';
import { Browser } from 'puppeteer';

import { BrowserService } from '@app/browser';

import { parseBrowserError, ScanStatus } from 'entities/scan-status';
import { Scanner } from 'libs/scanner.interface';

import { CoreInputDto } from './core.input.dto';
import * as pages from './pages';
import * as ScanPage from 'entities/scan-page.entity';
import { getBaseDomain, getHttpsUrl } from './util';
import { CoreResultPages } from 'entities/core-result.entity';

@Injectable()
export class CoreScannerService
  implements Scanner<CoreInputDto, CoreResultPages>
{
  constructor(
    private browserService: BrowserService,
    private httpService: HttpService,
    @InjectPinoLogger(CoreScannerService.name)
    private readonly logger: PinoLogger,
  ) {}

  async scan(input: CoreInputDto): Promise<CoreResultPages> {
    const scanLogger = this.logger.logger.child(input);

    return await this.browserService.useBrowser(async (browser) => {
      const result = {
        base: {
          targetUrlBaseDomain: getBaseDomain(getHttpsUrl(input.url)),
        },
        notFound: await this.runNotFoundScan(input.url, scanLogger),
        primary: await this.runPrimaryScan(browser, input, scanLogger),
        robotsTxt: await this.runRobotsTxtScan(browser, input, scanLogger),
        sitemapXml: await this.runSitemapXmlScan(browser, input, scanLogger),
        dns: await this.runDnsScan(input.url, scanLogger),
        accessibility: await this.runAccessibilityScan(
          browser,
          input,
          scanLogger,
        ),
      };

      scanLogger.info({ result }, 'solutions scan results');

      return result;
    });
  }

  private async runNotFoundScan(
    url: string,
    logger: Logger,
  ): Promise<ScanPage.NotFoundPageScan> {
    try {
      return {
        status: ScanStatus.Completed,
        result: {
          notFoundScan: {
            targetUrl404Test: await pages.createNotFoundScanner(
              this.httpService,
              url,
            ),
          },
        },
        error: null,
      };
    } catch (error) {
      return {
        status: this.getScanStatus(error, url, logger),
        result: null,
        error,
      };
    }
  }

  private async runPrimaryScan(
    browser: Browser,
    input: CoreInputDto,
    logger: Logger,
  ): Promise<ScanPage.PrimaryScan> {
    try {
      const result = await this.browserService.processPage(
        browser,
        pages.createPrimaryScanner(logger.child({ page: 'primary' }), input),
      );

      return {
        status: ScanStatus.Completed,
        result,
        error: null,
      };
    } catch (error) {
      return {
        status: this.getScanStatus(error, input.url, logger),
        result: null,
        error,
      };
    }
  }

  private async runRobotsTxtScan(
    browser: Browser,
    input: CoreInputDto,
    logger: Logger,
  ): Promise<ScanPage.RobotsTxtPageScan> {
    try {
      const result = await this.browserService.processPage(
        browser,
        pages.createRobotsTxtScanner(
          logger.child({ page: 'robots.txt' }),
          input,
        ),
      );
      return {
        status: ScanStatus.Completed,
        result,
        error: null,
      };
    } catch (error) {
      return {
        status: this.getScanStatus(error, input.url, logger),
        result: null,
        error,
      };
    }
  }

  private async runSitemapXmlScan(
    browser: Browser,
    input: CoreInputDto,
    logger: Logger,
  ): Promise<ScanPage.SitemapXmlPageScan> {
    try {
      const result = await this.browserService.processPage(
        browser,
        pages.createSitemapXmlScanner(
          logger.child({ page: 'sitemap.xml' }),
          input,
        ),
      );
      return {
        status: ScanStatus.Completed,
        result,
        error: null,
      };
    } catch (error) {
      return {
        status: this.getScanStatus(error, input.url, logger),
        result: null,
        error,
      };
    }
  }

  private async runDnsScan(
    url: string,
    logger: Logger,
  ): Promise<ScanPage.DnsPageScan> {
    try {
      const result = await pages.dnsScan(logger, url);
      return {
        status: ScanStatus.Completed,
        result: {
          dnsScan: {
            ipv6: result.ipv6,
            dnsHostname: result.dnsHostname,
          },
        },
        error: null,
      };
    } catch (error) {
      return {
        status: this.getScanStatus(error, url, logger),
        result: null,
        error,
      };
    }
  }

  private async runAccessibilityScan(
    browser: Browser,
    input: CoreInputDto,
    logger: Logger,
  ): Promise<ScanPage.AccessibilityPageScan> {
    try {
      const result = await this.browserService.processPage(
        browser,
        pages.createAccessibilityScanner(
          logger.child({ page: 'accessibility' }),
          input,
        ),
      );
      return {
        status: ScanStatus.Completed,
        result,
        error: null,
      };
    } catch (error) {
      return {
        status: this.getScanStatus(error, input.url, logger),
        result: null,
        error,
      };
    }
  }

  private getScanStatus(error: Error, url: string, logger: Logger) {
    const scanStatus = parseBrowserError(error);
    if (scanStatus === ScanStatus.UnknownError) {
      logger.warn(`Unknown Error calling ${url}: ${error.message}`);
    }
    return scanStatus;
  }
}
