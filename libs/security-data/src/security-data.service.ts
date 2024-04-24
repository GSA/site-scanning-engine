import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { join } from 'path';
import { parseString } from 'fast-csv';
import { fetchSecurityData } from './fetch-security-data';
import { SecurityPageScan } from 'entities/scan-page.entity';
import { ScanStatus } from 'entities/scan-status';

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

  async getSecurityResults(url: string): Promise<SecurityPageScan> {
    this.logger.log(`Getting security results for ${url}`);

    if (!existsSync(this.filePath)) {
      this.logger.log(
        `No file found for path ${this.filePath} -- fetching data`,
      );
      try {
        await this.fetchAndSaveSecurityData();
      } catch (error) {
        return this.handleScanError(
          `An error occurred fetching security data: ${error.message}`,
        );
      }
    }

    let matchingRow: { [key: string]: string } | null = null;

    try {
      const csvString = await fs.readFile(this.filePath, 'utf8');

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
    } catch (error) {
      return this.handleScanError(
        `An error occurred parsing security data: ${error.message}`,
      );
    }

    if (!matchingRow) {
      return this.handleScanError(
        'No matching domain found in security data CSV',
      );
    }

    const httpsEnforced =
      matchingRow.domain_enforces_https.toLowerCase() === 'true';
    const hstsPreloaded =
      matchingRow.hsts_base_domain_preloaded.toLowerCase() === 'true';

    this.logger.log(
      `Security results for ${url}: httpsEnforced=${httpsEnforced}, hstsPreloaded=${hstsPreloaded}`,
    );

    return {
      status: ScanStatus.Completed,
      result: {
        securityScan: {
          httpsEnforced,
          hstsPreloaded,
        },
      },
    };
  }

  async fetchAndSaveSecurityData(): Promise<void> {
    this.logger.log(`Fetching security data from ${this.securityDataCsvUrl}`);

    let csvData: string | null = null;

    csvData = await fetchSecurityData(this.securityDataCsvUrl, this.logger);

    if (csvData) {
      try {
        await fs.mkdir(this.dirPath, { recursive: true });
        await fs.writeFile(this.filePath, csvData, 'utf8');
        this.logger.log(`Security data saved to ${this.filePath}`);
      } catch (error) {
        const err = error as Error;
        this.logger.error(
          `An error occurred saving security data: ${err.message}`,
        );
      }
    } else {
      this.logger.error('No CSV data was fetched');
    }
  }

  private handleScanError(errorMessage: string): SecurityPageScan {
    this.logger.error(errorMessage);
    return {
      status: ScanStatus.UnknownError,
      error: errorMessage,
    };
  }
}
