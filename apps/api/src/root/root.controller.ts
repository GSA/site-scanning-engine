import { Controller, Get } from '@nestjs/common';

/**
 * RootController is the root endpoint controller. It returns documentation about the API.
 */
@Controller()
export class RootController {
  @Get()
  documentation() {
    return {
      endpoints: ['websites', 'results'],
    };
  }
}
