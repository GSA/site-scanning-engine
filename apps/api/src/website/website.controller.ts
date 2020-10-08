import { CreateWebsiteDto } from '@app/database/websites/dto/create-website.dto';
import { WebsiteService } from '@app/database/websites/websites.service';
import { Body, Controller, Get, Post } from '@nestjs/common';

@Controller('websites')
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  async getWebsites() {
    const websites = await this.websiteService.findAll();
    return websites;
  }

  @Post()
  async createWebsite(@Body() createWebsiteDto: CreateWebsiteDto) {
    await this.websiteService.create(createWebsiteDto);
  }
}
