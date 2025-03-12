import { Controller, Logger } from '@nestjs/common';
import * as cuid from 'cuid';

import { CoreScannerService } from '@app/core-scanner';
import { WebsiteService } from '@app/database/websites/websites.service';
import { CoreResultService } from '@app/database/core-results/core-result.service';
import { CoreInputDto } from "@app/core-scanner/core.input.dto";

@Controller()
export class ScanController {
  private logger = new Logger(ScanController.name);

  constructor(
    private readonly coreScannerService: CoreScannerService,
    private readonly coreResultService: CoreResultService,
    private readonly websiteService: WebsiteService,
  ) {}

  async scanSite(url: string, page?: string | null, scan?: string | null) {
    const website = await this.websiteService.findByUrl(url);
    if (!website) {
      this.logger.error({ scanUrl: url }, `Error: Target Scan URL not found in website database: '${url}'`);
      return;
    }

    const scanConfig: CoreInputDto = {
      websiteId: website.id,
      url: website.url,
      filter: website.filter,
      pageviews: website.pageviews,
      visits: website.visits,
      scanId: cuid(),
    };

    if (page) {
      scanConfig.page = page;
    }

    if (scan) {
      scanConfig.scan = scan;
    }

    const results = await this.coreScannerService.scan(scanConfig);

    await this.coreResultService.createFromCoreResultPages(
      website.id,
      results,
      this.logger,
      website.filter,
      website.pageviews,
      website.visits,
      website.url,
    );

    this.logger.log({ msg: 'Got results', results }, `Results compiled for '${url}'`);
  }
}
