import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { join } from 'path';
import { parseString } from 'fast-csv';
import { fetchSecurityData } from './data-fetcher';

type SecurityScanResult = {
  httpsEnforced: boolean;
  hstsPreloaded: boolean;
};

@Injectable()
export class SecurityDataService {
  private securityDataCsvUrl: string;
  private dirPath: string;
  private filePath: string;
  private logger = new Logger(SecurityDataService.name);

  constructor(private configService: ConfigService) {
    this.securityDataCsvUrl =
      this.configService.get<string>('securityDataCsvUrl');
    this.dirPath = this.configService.get<string>('dirPath');
    this.filePath = join(this.dirPath, 'security-data.csv');
  }

  async getSecurityResults(url: string): Promise<SecurityScanResult | null> {
    this.logger.log(`Getting security results for ${url}`);

    if (!existsSync(this.filePath)) {
      this.logger.log(
        `No file found for path ${this.filePath} -- fetching data`,
      );
      await this.fetchAndSaveSecurityData();
    }

    const csvString = await fs.readFile(this.filePath, 'utf8');

    let matchingRow: { [key: string]: string } | null = null;

    await new Promise((resolve, reject) => {
      parseString(csvString, { headers: true })
        .on('data', (row: { [key: string]: string }) => {
          if (row.domain === url) {
            matchingRow = row;
            resolve(null);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (!matchingRow) {
      this.logger.log('No matching domain found in CSV');
      return null;
    }

    const httpsEnforced =
      matchingRow.domain_enforces_https.toLowerCase() === 'true';
    const hstsPreloaded =
      matchingRow.hsts_base_domain_preloaded.toLowerCase() === 'true';

    this.logger.log(
      `Security results for ${url}: httpsEnforced=${httpsEnforced}, hstsPreloaded=${hstsPreloaded}`,
    );

    return {
      httpsEnforced,
      hstsPreloaded,
    };
  }

  async fetchAndSaveSecurityData(): Promise<void> {
    this.logger.log(`Fetching security data from ${this.securityDataCsvUrl}`);

    const csvData = await fetchSecurityData(
      this.securityDataCsvUrl,
      this.logger,
    );

    if (csvData) {
      await fs.mkdir(this.dirPath, { recursive: true });
      await fs.writeFile(this.filePath, csvData, 'utf8');
      this.logger.log(`Security data saved to ${this.filePath}`);
    } else {
      this.logger.error('No CSV data was fetched');
    }
  }
}
