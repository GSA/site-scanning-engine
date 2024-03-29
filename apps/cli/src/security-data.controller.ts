import { Controller } from '@nestjs/common';

import { SecurityDataService } from '@app/security-data';

@Controller()
export class SecurityDataController {
  constructor(private readonly securityDataService: SecurityDataService) {}

  async fetchAndSaveSecurityData() {
    await this.securityDataService.fetchAndSaveSecurityData();
  }
}
