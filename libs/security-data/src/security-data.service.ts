import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, promises as fs } from 'fs';
import { join } from 'path';
import { parseString } from 'fast-csv';
import { fetchSecurityData } from './fetch-security-data';
import { SecurityScans } from 'entities/scan-page.entity';

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

  async getSecurityResults(url: string): Promise<SecurityScans> {
    this.logger.log(`Getting security results for ${url}`);

    if (!existsSync(this.filePath)) {
      this.logger.log(
        `No file found for path ${this.filePath} -- fetching data`,
      );
      try {
        await this.fetchAndSaveSecurityData();
      } catch (error) {
        this.wrapErrorAndRethrow("An error occurred fetching security data", error);
      }
    }

    let matchingRow: { [key: string]: string } | null = null;

    try {
      const csvString = await fs.readFile(this.filePath, 'utf8');

      await new Promise((resolve, reject) => {
        parseString(csvString, {headers: true})
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
      this.wrapErrorAndRethrow("An error occurred parsing security data", error);
    }

    if (!matchingRow) {
      throw new Error('No matching domain found in security data CSV');
    }

    const securityScan = this.getScanResult(matchingRow);

    this.logger.log(
      `Security results for ${url}: httpsEnforced=${securityScan.httpsEnforced}, hstsPreloaded=${securityScan.hsts}`,
    );

    return {
      securityScan,
    };
  }

  async fetchAndSaveSecurityData(): Promise<void> {
    this.logger.log(`Fetching security data from ${this.securityDataCsvUrl}`);

    const csvData: string = await fetchSecurityData(this.securityDataCsvUrl, this.logger);

    if (csvData) {
      try {
        await fs.mkdir(this.dirPath, {recursive: true});
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

  private getScanResult(row: { [key: string]: string }): {
    httpsEnforced: boolean;
    hsts: boolean;
  } {
    return {
      httpsEnforced: row.domain_enforces_https.toLowerCase() === 'true',
      hsts:
        row.hsts_base_domain_preloaded.toLowerCase() === 'true' ||
        row.domain_uses_strong_hsts.toLowerCase() === 'true',
    };
  }

  private wrapErrorAndRethrow(message: string, error: Error): void {
    throw new Error(`${message}: ${error.message}`);
  }
}
