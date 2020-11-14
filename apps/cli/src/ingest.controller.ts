import { IngestService } from '@app/ingest';
import { Controller } from '@nestjs/common';

@Controller()
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  async writeUrls(limit?: number) {
    const urls = await this.ingestService.getUrls();
    await this.ingestService.writeUrls(urls, limit);
  }
}
