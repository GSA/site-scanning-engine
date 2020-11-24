import { WebsiteService } from '@app/database/websites/websites.service';
import { Controller, Get } from '@nestjs/common';
import { websiteSerializer } from './serializer';
import { map } from 'lodash';

@Controller('websites')
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  async getResults() {
    const websites = await this.websiteService.findAllWithResult();
    const serialized = map(websites, websiteSerializer);

    return serialized;
  }
}
