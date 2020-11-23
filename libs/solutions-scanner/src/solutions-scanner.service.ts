import { BROWSER_TOKEN, parseBrowserError } from '@app/browser';
import { ScanStatus } from '@app/core-scanner/scan-status';
import { LoggerService } from '@app/logger';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Scanner } from 'common/interfaces/scanner.interface';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';
import { sum, uniq } from 'lodash';
import { Browser, Page, Request, Response } from 'puppeteer';
import { SolutionsInputDto } from './solutions.input.dto';

@Injectable()
export class SolutionsScannerService
  implements Scanner<SolutionsInputDto, SolutionsResult>, OnModuleDestroy {
  constructor(
    @Inject(BROWSER_TOKEN) private browser: Browser,
    private logger: LoggerService,
  ) {}

  async scan(input: SolutionsInputDto): Promise<SolutionsResult> {
    const url = this.getHttpsUrls(input.url);

    let result: SolutionsResult;
    let page: Page;
    let robotsPage: Page;
    let sitemapPage: Page;

    try {
      // load the pages
      page = await this.browser.newPage();
      robotsPage = await this.browser.newPage();
      sitemapPage = await this.browser.newPage();
      await page.setCacheEnabled(false);
      await robotsPage.setCacheEnabled(false);

      // attach listeners
      const cssPages = [];
      page.on('response', async response => {
        if (response.request().resourceType() == 'stylesheet') {
          const cssPage = await response.text();
          cssPages.push(cssPage);
        }
      });

      const outboundRequests: Request[] = [];
      page.on('request', request => {
        outboundRequests.push(request);
      });

      // goto url and wait until there are only 2 idle requests
      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
      });

      // go to the robots page from the target url
      const robotsUrl = new URL(url);
      robotsUrl.pathname = 'robots.txt';
      const robotsResponse = await robotsPage.goto(robotsUrl.toString());

      // go to the sitemap page from the targeet url
      const sitemapUrl = new URL(url);
      sitemapUrl.pathname = 'sitemap.xml';
      const sitemapResponse = await sitemapPage.goto(sitemapUrl.toString());

      // extract the html page source
      const htmlText = await response.text();
      const robotsText = await robotsResponse.text();
      const sitemapText = await sitemapResponse.text();

      // build the result
      result = await this.buildResult(
        input.websiteId,
        cssPages,
        htmlText,
        page,
        outboundRequests,
        robotsResponse,
        robotsText,
        sitemapResponse,
        sitemapText,
      );
    } catch (error) {
      // build error result
      result = this.buildErrorResult(input.websiteId, error);
      if (result.status === ScanStatus.UnknownError) {
        this.logger.warn(
          `Unknown Error calling ${input.url}: ${error.message}`,
        );
        console.log(error);
      }
    } finally {
      await page.close();
      this.logger.debug('closing page');
      await robotsPage.close();
      this.logger.debug('closing robots page');
      await sitemapPage.close();
      this.logger.debug('closing sitemap page');
    }

    return result;
  }

  private getHttpsUrls(url: string) {
    if (!url.startsWith('https://')) {
      return `https://${url.toLowerCase()}`;
    } else {
      return url.toLowerCase();
    }
  }

  private buildErrorResult(websiteId: number, err: Error) {
    const errorType = parseBrowserError(err);
    const result = new SolutionsResult();
    const website = new Website();
    website.id = websiteId;
    result.website = website;
    result.status = errorType;

    return result;
  }

  private async buildResult(
    websiteId: number,
    cssPages: string[],
    htmlText: string,
    page: Page,
    outboundRequests: Request[],
    robotsResponse: Response,
    robotsText: string,
    sitemapResponse: Response,
    sitemapText: string,
  ): Promise<SolutionsResult> {
    const result = new SolutionsResult();
    const website = new Website();
    website.id = websiteId;
    result.website = website;

    result.status = ScanStatus.Completed;
    result.usaClasses = await this.usaClassesCount(page);
    result.uswdsString = this.uswdsInHtml(htmlText);
    result.uswdsTables = this.tableCount(htmlText);
    result.uswdsInlineCss = this.inlineUsaCssCount(htmlText);
    result.uswdsUsFlag = this.uswdsFlagDetected(htmlText);
    result.uswdsUsFlagInCss = this.uswdsFlagInCSS(cssPages);
    result.uswdsStringInCss = this.uswdsInCss(cssPages);
    result.uswdsMerriweatherFont = this.uswdsMerriweatherFont(cssPages);
    result.uswdsPublicSansFont = this.uswdsPublicSansFont(cssPages);
    result.uswdsSourceSansFont = this.uswdsSourceSansFont(cssPages);
    result.uswdsSemanticVersion = this.uswdsSemVer(cssPages);
    result.uswdsVersion = result.uswdsSemanticVersion ? 20 : 0;
    result.uswdsCount = this.uswdsCount(result);

    // dap
    result.dapDetected = this.dapDetected(outboundRequests);
    result.dapParameters = this.dapParameters(outboundRequests);

    // seo
    result.ogTitleFinalUrl = await this.findOpenGraphTag(page, 'og:title');
    result.ogDescriptionFinalUrl = await this.findOpenGraphTag(
      page,
      'og:description',
    );
    result.mainElementFinalUrl = await this.findMainElement(page);

    // robots.txt
    result.robotsTxtFinalUrl = robotsResponse.url();
    result.robotsTxtFinalUrlLive = robotsResponse.status() / 100 === 2;
    result.robotsTxtTargetUrlRedirects =
      robotsResponse.request().redirectChain().length > 0;
    result.robotsTxtFinalUrlSize = Buffer.byteLength(robotsText, 'utf-8');
    result.robotsTxtCrawlDelay = this.findRobotsCrawlDelay(robotsText);
    result.robotsTxtSitemapLocations = this.findRobotsSitemapLocations(
      robotsText,
    );

    // sitemap.xml
    const sitemapUrl = new URL(sitemapResponse.url());
    const sitemapLive = sitemapResponse.status() / 100 == 2;

    result.sitemapXmlFinalUrl = sitemapUrl.toString();
    result.sitemapXmlFinalUrlLive = sitemapLive;
    result.sitemapTargetUrlRedirects =
      sitemapResponse.request().redirectChain().length > 0;

    // conditional fields depending on whether it's a real sitemap
    if (sitemapUrl.pathname === '/sitemap.xml' && sitemapLive) {
      result.sitemapXmlDetected = true;
      result.sitemapXmlFinalUrlFilesize = Buffer.byteLength(
        sitemapText,
        'utf-8',
      );
    } else {
      result.sitemapXmlDetected = false;
    }

    return result;
  }

  private uswdsCount(result: SolutionsResult) {
    const uswdsCount = sum([
      result.usaClasses,
      result.uswdsString,
      result.uswdsTables,
      result.uswdsInlineCss,
      result.uswdsUsFlag,
      result.uswdsUsFlagInCss,
      result.uswdsStringInCss,
      result.uswdsMerriweatherFont,
      result.uswdsSourceSansFont,
      result.uswdsPublicSansFont,
      result.uswdsVersion,
    ]);
    return uswdsCount;
  }

  private async usaClassesCount(page: Page) {
    const usaClassesCount = await page.evaluate(() => {
      const usaClasses = [...document.querySelectorAll("[class^='usa-']")];

      let score = 0;

      if (usaClasses.length > 0) {
        score = Math.round(Math.sqrt(usaClasses.length)) * 5;
      }

      return score;
    });

    return usaClassesCount;
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

  private uswdsSemVer(cssPages: string[]): string | null {
    const re = /uswds v?[0-9.]*/i;

    const versions: string[] = [];

    for (const page of cssPages) {
      const match = page.match(re);

      if (match) {
        const version = match[0].split(' ')[1];
        versions.push(version);
      }
    }

    if (versions) {
      const uniqueVersions = uniq(versions);
      if (uniqueVersions.length > 1) {
        this.logger.debug(`found multiple USWDS versions ${uniqueVersions}`);
      }
      return uniqueVersions[0];
    } else {
      return null;
    }
  }

  /**
   * dapDetected looks to see if the Digital Analytics Program is detected on a page.
   *
   * It works by looking for the Google Analytics UA Identifier in either the URL or Post Data.
   * @param outboundRequests
   */
  private dapDetected(outboundRequests: Request[]) {
    const dapUaId = 'UA-33523145-1';
    let detected = false;

    for (const request of outboundRequests) {
      if (request.url().includes(dapUaId)) {
        detected = true;
        break;
      }

      try {
        if (request.postData().includes(dapUaId)) {
          detected = true;
          break;
        }
      } catch (error) {
        // fine to ignore if there's no post body.
      }
    }

    return detected;
  }

  private dapParameters(outboundRequests: Request[]) {
    const dapUrl = 'dap.digitalgov.gov/Universal-Federated-Analytics-Min.js';

    let parameters: string;
    for (const request of outboundRequests) {
      const requestUrl = request.url();

      if (requestUrl.includes(dapUrl)) {
        const parsedUrl = new URL(requestUrl);
        parameters = parsedUrl.searchParams.toString();
        break;
      }
    }

    return parameters;
  }

  private async findOpenGraphTag(page: Page, target: string) {
    const openGraphResult = await page.evaluate((target: string) => {
      const ogTag = document.querySelector<Element>(
        `head > meta[property="${target}"]`,
      );

      let result: string | null = null;
      if (ogTag) {
        result = ogTag.getAttribute('content');
      }
      return result;
    }, target);

    return openGraphResult;
  }

  private async findMainElement(page: Page) {
    const main = await page.evaluate(() => {
      const main = [...document.getElementsByTagName('main')];

      return main.length > 0;
    });

    return main;
  }

  private findRobotsCrawlDelay(robotsTxt: string) {
    const directives = robotsTxt.split('\n');
    let crawlDelay: number;

    for (const directive of directives) {
      if (directive.toLowerCase().startsWith('crawl-delay:')) {
        try {
          crawlDelay = parseInt(directive.split(' ')[1]);
        } catch (e) {
          const err = e as Error;
          this.logger.warn(
            `Could not parse this crawl delay: ${directive}. ${err.message}`,
          );
        }
      }
    }

    return crawlDelay;
  }

  private findRobotsSitemapLocations(robotsTxt: string) {
    const directives = robotsTxt.split('\n');
    const sitemapLocations: string[] = [];

    for (const directive of directives) {
      if (directive.toLowerCase().startsWith('sitemap:')) {
        try {
          const sitemapLocation = directive.split(' ')[1];
          sitemapLocations.push(sitemapLocation);
        } catch (e) {
          const err = e as Error;
          this.logger.warn(
            `Could not parse this sitemap: ${directive}. ${err.message}`,
          );
        }
      }
    }

    return sitemapLocations.join(',');
  }

  async onModuleDestroy() {
    await this.browser.close();
  }
}
