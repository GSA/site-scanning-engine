import { HttpService, Injectable } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { Logger } from 'pino';

import { BrowserService } from '@app/browser';
import { parseBrowserError, ScanStatus } from '@app/core-scanner/scan-status';

import { CoreResult } from 'entities/core-result.entity';
import { Scanner } from 'libs/scanner.interface';

import { CoreInputDto } from './core.input.dto';
import * as pages from './pages';

@Injectable()
export class CoreScannerService implements Scanner<CoreInputDto, CoreResult> {
  constructor(
    private browserService: BrowserService,
    private httpService: HttpService,
    @InjectPinoLogger(CoreScannerService.name)
    private readonly logger: PinoLogger,
  ) {}

  async scan(input: CoreInputDto): Promise<CoreResult> {
    const scanLogger = this.logger.logger.child(input);

    const scanData = await this.browserService.useBrowser(async (browser) => {
      const [notFound, home, robotsTxt, sitemapXml] = await Promise.all([
        pages.createNotFoundScanner(this.httpService, input.url).then(
          (targetUrl404Test) => ({
            status: ScanStatus.Completed,
            result: {
              notFoundScan: {
                targetUrl404Test,
              },
            },
          }),
          (error) => {
            return {
              status: this.getScanStatus(error, input.url, scanLogger),
              result: null,
            };
          },
        ),
        this.browserService
          .processPage(
            browser,
            pages.createHomePageScanner(
              scanLogger.child({ page: 'home' }),
              input,
            ),
          )
          .then(
            (result) => ({
              status: ScanStatus.Completed,
              result,
            }),
            (error) => ({
              status: this.getScanStatus(error, input.url, scanLogger),
              result: null,
            }),
          ),
        this.browserService
          .processPage(
            browser,
            pages.createRobotsTxtScanner(
              scanLogger.child({ page: 'robots.txt' }),
              input,
            ),
          )
          .then(
            (result) => ({
              status: ScanStatus.Completed,
              result,
            }),
            (error) => {
              return {
                status: this.getScanStatus(error, input.url, scanLogger),
                result: null,
              };
            },
          ),
        this.browserService
          .processPage(
            browser,
            pages.createSitemapXmlScanner(
              scanLogger.child({ page: 'sitemap.xml' }),
              input,
            ),
          )
          .then(
            (result) => ({
              status: ScanStatus.Completed,
              result,
            }),
            (error) => ({
              status: this.getScanStatus(error, input.url, scanLogger),
              result: null,
            }),
          ),
      ]);
      const result = {
        notFound,
        home,
        robotsTxt,
        sitemapXml,
      };
      scanLogger.info({ result }, 'solutions scan results');
      return result;
    });
    return CoreResult.fromScanData(input.websiteId, scanData);
  }

  getScanStatus(error: Error, url: string, logger: Logger) {
    const scanStatus = parseBrowserError(error);
    if (scanStatus === ScanStatus.UnknownError) {
      logger.warn(`Unknown Error calling ${url}: ${error.message}`);
    }
    return scanStatus;
  }
}
