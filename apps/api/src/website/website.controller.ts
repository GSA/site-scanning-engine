import { WebsiteService } from '@app/database/websites/websites.service';
import { Controller, Get } from '@nestjs/common';

@Controller('websites')
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  async getWebsites() {
    const websites = await this.websiteService.findAll();
    return websites;
  }
}
