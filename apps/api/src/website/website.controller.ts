import { FilterWebsiteDto } from 'apps/api/src/website/filter-website.dto';
import { WebsiteService } from '@app/database/websites/websites.service';
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { NotFoundInterceptor } from '../not-found.interceptor';
import { WebsiteSerializerInterceptor } from './website-serializer.interceptor';
import {
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { WebsiteApiResultDto } from './website-api-result.dto';
import { PaginatedWebsiteResponseDto } from './paginated-website-response.dto';
import { ApiKeyGuard } from '../apikey.guard';

const WEBSITE_ROUTE_NAME = 'websites';

@Controller(WEBSITE_ROUTE_NAME)
@UseGuards(ApiKeyGuard)
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @UseInterceptors(WebsiteSerializerInterceptor)
  @ApiOkResponse({
    // This decorator is for OpenAPI/Swagger documentation.
    description: 'A successful response from the API.',
    type: PaginatedWebsiteResponseDto,
  })
  @ApiInternalServerErrorResponse({
    // This decorator is For OpenAPI/Swagger documentation.
    description: 'This response type indicates an internal error.',
  })
  async getResults(@Query() query: FilterWebsiteDto) {
    // Ensure pagination values are safe integers within expected bounds to
    // prevent passing unsanitized user input downstream.
    const safePage = Math.max(1, Math.floor(Number(query.page) || 1));
    const safeLimit = Math.min(
      100,
      Math.max(1, Math.floor(Number(query.limit) || 10)),
    );

    const websites = await this.websiteService.paginatedFilter(query, {
      page: safePage,
      limit: safeLimit,
      route: `/${WEBSITE_ROUTE_NAME}`,
    });

    return websites;
  }

  @Get(':url')
  @UseInterceptors(
    WebsiteSerializerInterceptor,
    new NotFoundInterceptor('No website found for provided target url'),
  )
  @ApiOkResponse({
    // This decorator is for OpenAPI/Swagger documentation.
    description: 'A successful response from the API.',
    type: WebsiteApiResultDto,
  })
  @ApiNotFoundResponse({
    description:
      'This response indicated that there is no matching `target_url` in the database',
  })
  @ApiInternalServerErrorResponse({
    // This decorator is For OpenAPI/Swagger documentation.
    description: 'This response type indicates an internal error.',
  })
  async getResultByUrl(@Param('url') url: string) {
    return await this.websiteService.findByUrl(url);
  }
}
