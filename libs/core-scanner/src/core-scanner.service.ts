import { HttpService, Injectable } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { Logger } from 'pino';

import { BrowserService } from '@app/browser';
import { parseBrowserError, ScanStatus } from '@app/core-scanner/scan-status';

import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { Scanner } from 'libs/scanner.interface';

import { CoreInputDto } from './core.input.dto';
import * as pages from './pages';
import { getHttpsUrl } from './pages/helpers';
import { getBaseDomain } from './test-helper';

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
            return { status: parseBrowserError(error), result: null };
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
            (error) => ({ status: parseBrowserError(error), result: null }),
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
              return { status: parseBrowserError(error), result: null };
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
            (error) => ({ status: parseBrowserError(error), result: null }),
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
}

const buildErrorResult = (
  logger: Logger,
  websiteId: number,
  err: Error,
  input: CoreInputDto,
  error: Error,
) => {
  const url = getHttpsUrl(input.url);
  const errorType = parseBrowserError(err);

  const website = new Website();
  website.id = websiteId;

  const result = new CoreResult();
  result.website = website;

  // TODO - avoid having global error result
  result.notFoundScanStatus = errorType;
  result.homeScanStatus = errorType;
  result.robotsTxtScanStatus = errorType;
  result.sitemapXmlScanStatus = errorType;

  result.targetUrlBaseDomain = getBaseDomain(url);

  if (errorType === ScanStatus.UnknownError) {
    logger.warn(`Unknown Error calling ${input.url}: ${error.message}`);
  }

  return result;
};
