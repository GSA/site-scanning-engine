import { HttpService, Injectable, Logger } from '@nestjs/common';

import { BrowserService } from '@app/browser';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { coreScan } from '@app/page-scanners/home-page/core-scan';
import { buildCoreErrorResult } from '@app/page-scanners/scans/core';
import { Scanner } from 'libs/scanner.interface';
import { CoreResult } from 'entities/core-result.entity';
import { ScanStatus } from './scan-status';

@Injectable()
export class CoreScannerService implements Scanner<CoreInputDto, CoreResult> {
  private logger = new Logger(CoreScannerService.name);

  constructor(
    private browserService: BrowserService,
    private httpService: HttpService,
  ) {}

  async scan(input: CoreInputDto): Promise<CoreResult> {
    try {
      const result = await this.browserService.processPage<CoreResult>(
        (page) => {
          return coreScan(this.httpService, this.logger, input, page);
        },
      );
      this.logger.log({ msg: 'core scan results', ...input });
      return result;
    } catch (error) {
      const err = error as Error;

      // build error result on error
      const result = buildCoreErrorResult(input, err);

      // log if the error is unknown
      if (result.status == ScanStatus.UnknownError) {
        this.logger.warn({
          msg: `Unknown Error calling ${input.url}: ${err.message}`,
          ...input,
        });
      }
      return result;
    }
  }
}
