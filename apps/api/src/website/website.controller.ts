import { WebsiteService } from '@app/database/websites/websites.service';
import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { NotFoundInterceptor } from '../not-found.interceptor';
import { WebsiteSerializerInterceptor } from './website-serializer.interceptor';

@Controller('websites')
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @UseInterceptors(WebsiteSerializerInterceptor)
  async getResults() {
    const websites = await this.websiteService.findAllWithResult();
    return websites;
  }

  @Get(':url')
  @UseInterceptors(
    new NotFoundInterceptor('No website found for target url'),
    WebsiteSerializerInterceptor,
  )
  async getResultByUrl(@Param('url') url: string) {
    const result = await this.websiteService.findByUrl(url);
    return result;
  }
}
