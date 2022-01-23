import { HttpService, Injectable, Logger } from '@nestjs/common';

import { BrowserService } from '@app/browser';
import { parseBrowserError, ScanStatus } from '@app/core-scanner/scan-status';

import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';
import { CoreResult } from 'entities/core-result.entity';
import { Scanner } from 'libs/scanner.interface';

import { CoreInputDto } from './core.input.dto';
import * as pages from './pages';
import { coreScan } from './pages/home-page/core-scan';
import { solutionsScan } from './pages/home-page/solutions-scan';
import { buildCoreErrorResult } from './scans/core';

@Injectable()
export class CoreScannerService
  implements
    Scanner<
      CoreInputDto,
      { solutionsResult: SolutionsResult; coreResult: CoreResult }
    >
{
  private logger = new Logger(CoreScannerService.name);

  constructor(
    private browserService: BrowserService,
    private httpService: HttpService,
  ) {}

  async scan(
    input: CoreInputDto,
  ): Promise<{ solutionsResult: SolutionsResult; coreResult: CoreResult }> {
    try {
      const [pageResult, robotsTxtResult, sitemapXmlResult] = await Promise.all(
        [
          this.browserService.processPage(async (page) => {
            const [coreResults, solutionsResults] = await Promise.all([
              coreScan(this.httpService, this.logger, input, page),
              solutionsScan(this.logger, input, page),
            ]);
            return {
              coreResults,
              solutionsResults,
            };
          }),
          this.browserService.processPage(
            pages.createRobotsTxtScanner(this.logger, input),
          ),
          this.browserService.processPage(
            pages.createSitemapXmlScanner(this.logger, input),
          ),
        ],
      );
      const result = {
        coreResult: pageResult.coreResults,
        solutionsResult: {
          ...sitemapXmlResult,
          ...robotsTxtResult,
          ...pageResult.solutionsResults,
        },
      };
      this.logger.log({ msg: 'solutions scan results', ...input, result });
      return result;
    } catch (error) {
      return {
        solutionsResult: buildErrorResult(
          this.logger,
          input.websiteId,
          error,
          input,
          error,
        ),
        coreResult: buildCoreErrorResult(input, error),
      };
    }
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
    logger.warn({
      msg: `Unknown Error calling ${input.url}: ${error.message}`,
      ...input,
    });
  }

  return result;
};
