import { Controller } from '@nestjs/common';

import { IngestService } from '@app/ingest';

@Controller()
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  async refreshUrls(limit?: number, federalSubdomainsUrl?: string) {
    const urls = await this.ingestService.getUrls(federalSubdomainsUrl);
    await this.ingestService.writeUrls(urls, limit);
  }
}
