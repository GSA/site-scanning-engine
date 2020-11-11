import { BROWSER_TOKEN } from '@app/browser';
import { LoggerService } from '@app/logger';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Scanner } from 'common/interfaces/scanner.interface';
import { UswdsResult } from 'entities/uswds-result.entity';
import { Website } from 'entities/website.entity';
import { Browser } from 'puppeteer';
import { UswdsInputDto } from './uswds.input.dto';

@Injectable()
export class UswdsScannerService
  implements Scanner<UswdsInputDto, UswdsResult>, OnModuleDestroy {
  constructor(
    @Inject(BROWSER_TOKEN) private browser: Browser,
    private logger: LoggerService,
  ) {}

  async scan(input: UswdsInputDto): Promise<UswdsResult> {
    const page = await this.browser.newPage();

    const result = new UswdsResult();
    const website = new Website();
    website.id = input.websiteId;

    result.website = website;

    const url = this.getHttpsUrls(input.url);
    await page.goto(url);

    const usaClassesCount = await page.evaluate(() => {
      const usaClasses = [...document.querySelectorAll("[class^='usa-']")];
      let score = 0;

      if (usaClasses.length > 0) {
        score = Math.round(Math.sqrt(usaClasses.length)) * 5;
      }

      return score;
    });

    result.usaClassesDetected = usaClassesCount;

    await this.browser.close();
    return result;
  }

  private getHttpsUrls(url: string) {
    if (!url.startsWith('https://')) {
      return `https://${url.toLowerCase()}`;
    } else {
      return url.toLowerCase();
    }
  }

  async onModuleDestroy() {
    await this.browser.close();
  }
}
