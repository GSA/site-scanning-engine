import { Controller } from '@nestjs/common';

import { IngestService } from '@app/ingest';

@Controller()
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  async refreshUrls(limit?: number) {
    const urls = await this.ingestService.getUrls();
    await this.ingestService.writeUrls(urls, limit);
    await this.ingestService.removeOldUrls(urls);
  }
}
