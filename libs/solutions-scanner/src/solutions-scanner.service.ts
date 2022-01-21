import { Injectable, Logger } from '@nestjs/common';

import { BrowserService } from '@app/browser';
import { parseBrowserError, ScanStatus } from '@app/core-scanner/scan-status';
import * as pageScanners from '@app/page-scanners';
import { solutionsScan } from '@app/page-scanners/home-page/solutions-scan';

import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';
import { Scanner } from 'libs/scanner.interface';

import { SolutionsInputDto } from './solutions.input.dto';

@Injectable()
export class SolutionsScannerService
  implements Scanner<SolutionsInputDto, SolutionsResult>
{
  private logger = new Logger(SolutionsScannerService.name);

  constructor(private browserService: BrowserService) {}

  async scan(input: SolutionsInputDto): Promise<SolutionsResult> {
    try {
      const [pageResult, robotsTxtResult, sitemapXmlResult] = await Promise.all(
        [
          this.browserService.processPage((page) => {
            return solutionsScan(this.logger, input, page);
          }),
          this.browserService.processPage(
            pageScanners.createRobotsTxtScanner(this.logger, input),
          ),
          this.browserService.processPage(
            pageScanners.createSitemapXmlScanner(this.logger, input),
          ),
        ],
      );
      const result = { ...sitemapXmlResult, ...robotsTxtResult, ...pageResult };
      this.logger.log({ msg: 'solutions scan results', ...input, result });
      return result;
    } catch (error) {
      // build error result
      return buildErrorResult(
        this.logger,
        input.websiteId,
        error,
        input,
        error,
      );
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
