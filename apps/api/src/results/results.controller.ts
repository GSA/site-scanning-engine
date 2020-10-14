import { CoreResultService } from '@app/database/core-results/core-result.service';
import { Controller, Get } from '@nestjs/common';

@Controller('results')
export class ResultsController {
  constructor(private coreResultService: CoreResultService) {}

  @Get()
  async getResults() {
    const results = await this.coreResultService.findAll();
    return results;
  }
}
