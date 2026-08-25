import { Controller } from '@nestjs/common';
import { Logger } from '@nestjs/common';

import { fetchCommitDate } from '@app/security-data/fetch-commit-date';
import { CoreResultService } from '@app/database/core-results/core-result.service';

const DAP_FILE_PATH = 'data/source-lists/dap_top_100000_domains_30_days.csv';
const HTTPS_FILE_PATH = 'data/source-lists/cisa_https.csv';

@Controller()
export class DataFreshnessController {
  private readonly logger = new Logger(DataFreshnessController.name);

  constructor(private readonly coreResultService: CoreResultService) {}

  async updateDataFreshnessDates(): Promise<void> {
    this.logger.log(
      'Fetching last-commit dates for DAP and HTTPS source files',
    );

    const [dapDataDate, httpsDataDate] = await Promise.all([
      fetchCommitDate(DAP_FILE_PATH, this.logger),
      fetchCommitDate(HTTPS_FILE_PATH, this.logger),
    ]);

    this.logger.log(
      `Updating all core_result rows: dap_data_date=${dapDataDate}, https_data_date=${httpsDataDate}`,
    );
    await this.coreResultService.updateDataFreshnessDates(
      dapDataDate,
      httpsDataDate,
    );
    this.logger.log('Data freshness dates updated successfully');
  }
}
