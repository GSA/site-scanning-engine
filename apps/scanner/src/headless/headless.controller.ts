import { Controller } from '@nestjs/common';
import { HeadlessService } from './headless.service';

@Controller('headless')
export class HeadlessController {
  constructor(private headlessService: HeadlessService) {
    this.headlessService = headlessService;
  }
  async start() {
    const result = await this.headlessService.startScan(
      'https://www.google.com',
    );
    return result;
  }
}
