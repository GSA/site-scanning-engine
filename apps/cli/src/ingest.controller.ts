import { IngestService } from '@app/ingest';
import { Controller } from '@nestjs/common';

@Controller()
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  async writeUrls() {
    this.ingestService.writeUrls();
  }
}
