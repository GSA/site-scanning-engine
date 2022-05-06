import { Controller, Logger } from '@nestjs/common';
import * as cuid from 'cuid';

import { CoreScannerService } from '@app/core-scanner';
import { WebsiteService } from '@app/database/websites/websites.service';
import { CoreResultService } from '@app/database/core-results/core-result.service';

@Controller()
export class ScanController {
  private logger = new Logger(ScanController.name);

  constructor(
    private readonly coreScannerService: CoreScannerService,
    private readonly coreResultService: CoreResultService,
    private readonly websiteService: WebsiteService,
  ) {}

  async scanSite(url: string) {
    const website = await this.websiteService.findByUrl(url);
    if (!website) {
      this.logger.log(`URL not found in database: ${url}`);
      return;
    }

    const results = await this.coreScannerService.scan({
      websiteId: website.id,
      url: website.url,
      scanId: cuid(),
    });
    await this.coreResultService.createFromCoreResultPages(
      website.id,
      results,
      this.logger,
    );
    this.logger.log({ msg: 'Got results', results });
  }
}
