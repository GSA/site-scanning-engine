import { Controller } from '@nestjs/common';
import { HeadlessService } from './headless.service';

@Controller('headless')
export class HeadlessController {
  constructor(private headlessService: HeadlessService) {
    this.headlessService = headlessService;
  }
  async start() {
    const result = await this.headlessService.startScan(
      'https://18f.gov',
      'GSA',
      'Executive',
    );
    return result;
  }
}
