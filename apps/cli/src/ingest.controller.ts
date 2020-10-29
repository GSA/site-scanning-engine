import { IngestService } from '@app/ingest';
import { Controller } from '@nestjs/common';

@Controller()
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  async writeUrls(dev?: boolean) {
    const urls = await this.ingestService.getUrls();

    if (dev) {
      await this.ingestService.writeUrls(urls, 20);
    } else {
      await this.ingestService.writeUrls(urls);
    }
  }
}
