import { CoreResultService } from '@app/database/core-results/core-result.service';
import { CreateWebsiteDto } from '@app/database/websites/dto/create-website.dto';
import { WebsiteService } from '@app/database/websites/websites.service';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { websiteSerializer } from './serializer';
import { map } from 'lodash';

@Controller('websites')
export class WebsiteController {
  constructor(
    private readonly websiteService: WebsiteService,
    private readonly coreResultService: CoreResultService,
  ) {}

  @Get()
  async getResults() {
    const websites = await this.coreResultService.findResultsWithWebsite();
    const serialized = map(websites, website => {
      return websiteSerializer(website);
    });

    return serialized;
  }

  @Post()
  async createWebsite(@Body() createWebsiteDto: CreateWebsiteDto) {
    await this.websiteService.create(createWebsiteDto);
  }
}
