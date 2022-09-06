import { FilterWebsiteDto } from 'apps/api/src/website/filter-website.dto';
import { AnalysisService } from '@app/database/analysis/analysis.service';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../apikey.guard';

const WEBSITE_ROUTE_NAME = 'analysis';

@Controller(WEBSITE_ROUTE_NAME)
@UseGuards(ApiKeyGuard)
export class AnalysisController {
  constructor(private readonly service: AnalysisService) {}

  @Get()
  async getResults(@Query() query: FilterWebsiteDto) {
    return await this.service.getWebsiteAnalysis(query);
  }
}
