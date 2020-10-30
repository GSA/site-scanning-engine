import { CoreResultService } from '@app/database/core-results/core-result.service';
import { CreateWebsiteDto } from '@app/database/websites/dto/create-website.dto';
import { WebsiteService } from '@app/database/websites/websites.service';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { map } from 'lodash';
import { WebsiteResult } from './website-result.dto';
import { fromCoreResult } from './website-result.mapper';

@Controller('websites')
export class WebsiteController {
  constructor(
    private readonly websiteService: WebsiteService,
    private readonly coreResultService: CoreResultService,
  ) {}

  @Get()
  async getResults(): Promise<WebsiteResult[]> {
    const websites = await this.coreResultService.findResultsWithWebsite();
    const res = map(websites, fromCoreResult);
    return res;
  }

  @Post()
  async createWebsite(@Body() createWebsiteDto: CreateWebsiteDto) {
    await this.websiteService.create(createWebsiteDto);
  }
}
