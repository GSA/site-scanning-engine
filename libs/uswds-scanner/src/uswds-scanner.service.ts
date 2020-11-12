import { BROWSER_TOKEN } from '@app/browser';
import { LoggerService } from '@app/logger';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Scanner } from 'common/interfaces/scanner.interface';
import { UswdsResult } from 'entities/uswds-result.entity';
import { Website } from 'entities/website.entity';
import { sum } from 'lodash';
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

    const cssPages: string[] = [];
    page.on('response', async response => {
      if (response.request().resourceType() == 'stylesheet') {
        const cssPage = await response.text();
        cssPages.push(cssPage);
      }
    });

    const url = this.getHttpsUrls(input.url);
    const response = await page.goto(url);

    const usaClassesCount = await page.evaluate(() => {
      const usaClasses = [...document.querySelectorAll("[class^='usa-']")];
      let score = 0;

      if (usaClasses.length > 0) {
        score = Math.round(Math.sqrt(usaClasses.length)) * 5;
      }

      return score;
    });

    const htmlText = await response.text();

    const uswdsInHtml = this.uswdsInHtml(htmlText);
    const uswdsTables = this.tableCount(htmlText);
    const inlineCssCount = this.inlineUsaCssCount(htmlText);
    const usFlagHtml = this.uswdsFlagDetected(htmlText);
    const usFlagCss = this.uswdsFlagInCSS(cssPages);
    const uswdsCss = this.uswdsInCss(cssPages);
    const merriweatherFont = this.uswdsMerriweatherFont(cssPages);
    const publicSansFont = this.uswdsPublicSansFont(cssPages);
    const sourceSansFont = this.uswdsSourceSansFont(cssPages);
    const uswdsCount = sum([
      usaClassesCount,
      uswdsInHtml,
      uswdsTables,
      inlineCssCount,
      usFlagHtml,
      usFlagCss,
      uswdsCss,
      merriweatherFont,
      sourceSansFont,
      publicSansFont,
    ]);

    result.usaClasses = usaClassesCount;
    result.uswdsString = uswdsInHtml;
    result.uswdsTables = uswdsTables;
    result.uswdsInlineCss = inlineCssCount;
    result.uswdsUsFlag = usFlagHtml;
    result.uswdsUsFlagInCss = usFlagCss;
    result.uswdsStringInCss = uswdsCss;
    result.uswdsMerriweatherFont = merriweatherFont;
    result.uswdsPublicSansFont = publicSansFont;
    result.uswdsSourceSansFont = sourceSansFont;
    result.uswdsCount = uswdsCount;

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

  private uswdsInHtml(htmlText: string) {
    const re = /uswds/g;
    const occurrenceCount = [...htmlText.matchAll(re)].length;
    this.logger.debug(`uswds occurs ${occurrenceCount} times`);
    return occurrenceCount;
  }

  /**
   * tableCount detects the presence of <table> elements in HTML. This is a negative indicator of USWDS.
   *
   * @param htmlText html in text.
   */
  private tableCount(htmlText: string) {
    const re = /<table/g;
    const occurrenceCount = [...htmlText.matchAll(re)].length;
    let deduction = 0;

    if (occurrenceCount > 0) {
      const tableDeduction = -10;
      deduction = tableDeduction * occurrenceCount;
    }

    return deduction;
  }

  private inlineUsaCssCount(htmlText: string) {
    const re = /\.usa-/g;
    const occurrenceCount = [...htmlText.matchAll(re)].length;

    return occurrenceCount;
  }

  private uswdsFlagDetected(htmlText: string) {
    // these are the asset names of the small us flag in the USA Header for differnt uswds versions and devices.
    const re = /us_flag_small.png|favicon-57.png|favicon-192.png|favicon-72.png|favicon-144.png|favicon-114.png/;

    // all we need is one match to give the points;
    const occurrenceCount = htmlText.match(re);
    let score = 0;

    if (occurrenceCount) {
      score = 20;
    }
    return score;
  }

  private uswdsInCss(cssPages: string[]) {
    let score = 0;
    const re = /uswds/i;

    for (const page of cssPages) {
      const match = page.match(re);
      if (match) {
        score = 20;
        break;
      }
    }

    return score;
  }

  private uswdsFlagInCSS(cssPages: string[]) {
    // these are the asset names of the small us flag in the USA Header for differnt uswds versions and devices.
    const re = /us_flag_small.png|favicon-57.png|favicon-192.png|favicon-72.png|favicon-144.png|favicon-114.png/;
    let score = 0;

    for (const page of cssPages) {
      const match = page.match(re);
      if (match) {
        score = 20;
        break;
      }
    }

    return score;
  }

  private uswdsMerriweatherFont(cssPages: string[]) {
    const re = /[Mm]erriweather/;
    let score = 0;

    for (const page of cssPages) {
      const match = page.match(re);
      if (match) {
        score = 5;
        break;
      }
    }

    return score;
  }

  private uswdsPublicSansFont(cssPages: string[]) {
    const re = /[Pp]ublic.[Ss]ans/;
    let score = 0;

    for (const page of cssPages) {
      const match = page.match(re);
      if (match) {
        score = 20;
        break;
      }
    }

    return score;
  }

  private uswdsSourceSansFont(cssPages: string[]) {
    const re = /[Ss]ource.[Ss]ans.[Pp]ro/;
    let score = 0;

    for (const page of cssPages) {
      const match = page.match(re);
      if (match) {
        score = 5;
        break;
      }
    }

    return score;
  }

  async onModuleDestroy() {
    await this.browser.close();
  }
}
