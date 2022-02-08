import { HttpService, Injectable } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { Logger } from 'pino';

import { BrowserService } from '@app/browser';
import { parseBrowserError, ScanStatus } from '@app/core-scanner/scan-status';

import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';
import { CoreResult } from 'entities/core-result.entity';
import { Scanner } from 'libs/scanner.interface';

import { CoreInputDto } from './core.input.dto';
import * as pages from './pages';
import { buildCoreErrorResult } from './scans/core';

@Injectable()
export class CoreScannerService
  implements
    Scanner<
      CoreInputDto,
      { solutionsResult: SolutionsResult; coreResult: CoreResult }
    >
{
  constructor(
    private browserService: BrowserService,
    private httpService: HttpService,
    @InjectPinoLogger(CoreScannerService.name)
    private readonly logger: PinoLogger,
  ) {}

  async scan(
    input: CoreInputDto,
  ): Promise<{ solutionsResult: SolutionsResult; coreResult: CoreResult }> {
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
          coreResult: {
            targetUrl404Test: notFoundTest,
            ...pageResult.coreResult,
          },
          solutionsResult: {
            ...sitemapXmlResult,
            ...robotsTxtResult,
            ...pageResult.solutionsResult,
          },
        };
        scanLogger.info({ result }, 'solutions scan results');
        return result;
      } catch (error) {
        return {
          solutionsResult: buildErrorResult(
            scanLogger,
            input.websiteId,
            error,
            input,
            error,
          ),
          coreResult: buildCoreErrorResult(input, error),
        };
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
  const errorType = parseBrowserError(err);
  const result = new SolutionsResult();
  const website = new Website();
  website.id = websiteId;
  result.website = website;
  result.status = errorType;

  if (result.status === ScanStatus.UnknownError) {
    logger.warn(`Unknown Error calling ${input.url}: ${error.message}`);
  }

  return result;
};
