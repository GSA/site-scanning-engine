import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { Logger } from 'pino';

import { BrowserService } from '@app/browser';

import { parseBrowserError, ScanStatus } from 'entities/scan-status';
import { Scanner } from 'libs/scanner.interface';

import { CoreInputDto } from './core.input.dto';
import * as pages from './pages';
import { getBaseDomain, getHttpsUrl } from './util';
import { CoreResultPages } from '@app/database/core-results/core-result.service';

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

    const scanData = await this.browserService.useBrowser(async (browser) => {
      const [notFound, primary, robotsTxt, sitemapXml, dns] = await Promise.all(
        [
          pages.createNotFoundScanner(this.httpService, input.url).then(
            (targetUrl404Test) => ({
              status: ScanStatus.Completed,
              result: {
                notFoundScan: {
                  targetUrl404Test,
                },
              },
              error: null,
            }),
            (error) => {
              return {
                status: this.getScanStatus(error, input.url, scanLogger),
                result: null,
                error,
              };
            },
          ),
          this.browserService
            .processPage(
              browser,
              pages.createPrimaryScanner(
                scanLogger.child({ page: 'primary' }),
                input,
              ),
            )
            .then(
              (result) => ({
                status: ScanStatus.Completed,
                result,
                error: null,
              }),
              (error) => ({
                status: this.getScanStatus(error, input.url, scanLogger),
                result: null,
                error,
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
                error: null,
              }),
              (error) => {
                return {
                  status: this.getScanStatus(error, input.url, scanLogger),
                  result: null,
                  error,
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
                error: null,
              }),
              (error) => ({
                status: this.getScanStatus(error, input.url, scanLogger),
                result: null,
                error,
              }),
            ),
          pages.dnsScan(scanLogger, input.url).then(
            (ipv6) => ({
              status: ScanStatus.Completed,
              result: {
                dnsScan: {
                  ipv6,
                },
              },
              error: null,
            }),
            (error) => {
              return {
                status: this.getScanStatus(error, input.url, scanLogger),
                result: null,
                error,
              };
            },
          ),
        ],
      );
      const result = {
        base: {
          targetUrlBaseDomain: getBaseDomain(getHttpsUrl(input.url)),
        },
        notFound,
        primary,
        robotsTxt,
        sitemapXml,
        dns,
      };
      scanLogger.info({ result }, 'solutions scan results');
      return result;
    });
    return scanData;
  }

  getScanStatus(error: Error, url: string, logger: Logger) {
    const scanStatus = parseBrowserError(error);
    if (scanStatus === ScanStatus.UnknownError) {
      logger.warn(`Unknown Error calling ${url}: ${error.message}`);
    }
    return scanStatus;
  }
}
