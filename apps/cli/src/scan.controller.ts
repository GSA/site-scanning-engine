import { Controller } from '@nestjs/common';
import * as cuid from 'cuid';

import { CoreScannerService } from '@app/core-scanner';
import { WebsiteService } from '@app/database/websites/websites.service';

@Controller()
export class ScanController {
  constructor(
    private readonly coreScannerService: CoreScannerService,
    private readonly websiteService: WebsiteService,
  ) {}

  async scanSite(url: string) {
    const website = await this.websiteService.findByUrl(url);
    if (!website) {
      console.log(`URL not found in database: ${url}`);
      return;
    }

    await this.coreScannerService.scan({
      websiteId: website.id,
      url: website.url,
      scanId: cuid(),
    });
  }
}
