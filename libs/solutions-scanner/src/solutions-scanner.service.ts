import { HttpService, Injectable, Logger } from '@nestjs/common';

import { BrowserService } from '@app/browser';
import { parseBrowserError, ScanStatus } from '@app/core-scanner/scan-status';
import * as pageScanners from '@app/page-scanners';
import { coreScan } from '@app/page-scanners/home-page/core-scan';
import { solutionsScan } from '@app/page-scanners/home-page/solutions-scan';

import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';
import { Scanner } from 'libs/scanner.interface';

import { SolutionsInputDto } from './solutions.input.dto';
import { buildCoreErrorResult } from '@app/page-scanners/scans/core';
import { CoreResult } from 'entities/core-result.entity';

@Injectable()
export class SolutionsScannerService
  implements
    Scanner<
      SolutionsInputDto,
      { solutionsResult: SolutionsResult; coreResult: CoreResult }
    >
{
  private logger = new Logger(SolutionsScannerService.name);

  constructor(
    private browserService: BrowserService,
    private httpService: HttpService,
  ) {}

  async scan(
    input: SolutionsInputDto,
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
            pageScanners.createRobotsTxtScanner(this.logger, input),
          ),
          this.browserService.processPage(
            pageScanners.createSitemapXmlScanner(this.logger, input),
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
  input: SolutionsInputDto,
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
