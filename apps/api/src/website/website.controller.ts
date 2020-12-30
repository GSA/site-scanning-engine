import { FilterWebsiteDto } from '@app/database/websites/dto/filter-website.dto';
import { WebsiteService } from '@app/database/websites/websites.service';
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { NotFoundInterceptor } from '../not-found.interceptor';
import { PaginationOptions } from '../pagination-options';
import { WebsiteApiResult } from '../website-api-result';
import { WebsiteSerializerInterceptor } from './website-serializer.interceptor';

const WEBSITE_ROUTE_NAME = 'websites';

@Controller(WEBSITE_ROUTE_NAME)
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @UseInterceptors(WebsiteSerializerInterceptor)
  @ApiOkResponse({
    description: 'Successfully retrieved response for query.',
    type: WebsiteApiResult,
  })
  async getResults(
    @Query() query: FilterWebsiteDto,
    @Query() paginationOptions: PaginationOptions,
  ) {
    const websites = await this.websiteService.paginatedFilter(query, {
      page: paginationOptions.page,
      limit: paginationOptions.limit,
      route: `/${WEBSITE_ROUTE_NAME}`,
    });
    return websites;
  }

  @Get(':url')
  @UseInterceptors(
    WebsiteSerializerInterceptor,
    new NotFoundInterceptor('No website found for provided target url'),
  )
  async getResultByUrl(@Param('url') url: string) {
    const result = await this.websiteService.findByUrl(url);
    return result;
  }
}
