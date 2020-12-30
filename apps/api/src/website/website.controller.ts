import { FilterWebsiteDto } from '@app/database/websites/dto/filter-website.dto';
import { WebsiteService } from '@app/database/websites/websites.service';
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { NotFoundInterceptor } from '../not-found.interceptor';
import { ParseOptionalIntPipe } from '../parse-optional-int.pipe';
import { WebsiteSerializerInterceptor } from './website-serializer.interceptor';

const WEBSITE_ROUTE_NAME = 'websites';

@Controller(WEBSITE_ROUTE_NAME)
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @UseInterceptors(WebsiteSerializerInterceptor)
  async getResults(
    @Query() query: FilterWebsiteDto,
    @Query('page', ParseOptionalIntPipe) page = 1,
    @Query('limit', ParseOptionalIntPipe) limit = 10,
  ) {
    const websites = await this.websiteService.paginatedFilter(query, {
      page: page,
      limit: limit,
      route: `/${WEBSITE_ROUTE_NAME}`,
    });
    return websites;
  }

  @Get(':url')
  @UseInterceptors(
    WebsiteSerializerInterceptor,
    new NotFoundInterceptor('No website found for target url'),
  )
  async getResultByUrl(@Param('url') url: string) {
    const result = await this.websiteService.findByUrl(url);
    return result;
  }
}
