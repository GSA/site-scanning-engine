import { CoreResultService } from '@app/database/core-results/core-result.service';
import { CreateWebsiteDto } from '@app/database/websites/dto/create-website.dto';
import { WebsiteService } from '@app/database/websites/websites.service';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { CoreResult } from 'entities/core-result.entity';

@Controller('websites')
export class WebsiteController {
  constructor(
    private readonly websiteService: WebsiteService,
    private readonly coreResultService: CoreResultService,
  ) {}

  @Get()
  async getResults(): Promise<CoreResult[]> {
    const websites = await this.coreResultService.findResultsWithWebsite();
    return websites;
  }

  @Post()
  async createWebsite(@Body() createWebsiteDto: CreateWebsiteDto) {
    await this.websiteService.create(createWebsiteDto);
  }
}
