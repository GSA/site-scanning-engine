import { HttpService, Injectable } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { Logger } from 'pino';

import { BrowserService } from '@app/browser';
import { parseBrowserError, ScanStatus } from '@app/core-scanner/scan-status';

import { Website } from 'entities/website.entity';
import { CoreResult } from 'entities/core-result.entity';
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
    return this.browserService.useBrowser(async (browser) => {
      try {
        const [notFoundTest, pageResult, robotsTxtResult, sitemapXmlResult] =
          await Promise.all([
            pages.createNotFoundScanner(this.httpService, input.url),
            this.browserService.processPage(
              browser,
              pages.createHomePageScanner(
                scanLogger.child({ page: 'home' }),
                input,
              ),
            ),
            this.browserService.processPage(
              browser,
              pages.createRobotsTxtScanner(
                scanLogger.child({ page: 'robots.txt' }),
                input,
              ),
            ),
            this.browserService.processPage(
              browser,
              pages.createSitemapXmlScanner(
                scanLogger.child({ page: 'sitemap.xml' }),
                input,
              ),
            ),
          ]);
        const result = {
          targetUrl404Test: notFoundTest,
          ...pageResult,
          ...sitemapXmlResult,
          ...robotsTxtResult,
        };
        scanLogger.info({ result }, 'solutions scan results');
        return result;
      } catch (error) {
        return buildErrorResult(
          scanLogger,
          input.websiteId,
          error,
          input,
          error,
        );
      }
    });
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
