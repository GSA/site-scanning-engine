import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Browser } from 'puppeteer';
import { BROWSER_TOKEN } from '../browser.provider';
import { Scanner } from '../scanner.interface';
import { CoreInputDto } from '../../../../../dtos/scanners/core.input.dto';
import { CoreOutputDto } from '../../../../../dtos/scanners/core.output.dto';

/**
 * CoreScanner is the default scanner for the Site Scanning project.
 *
 * @remarks This scanner is returns the minimum amount of information we'd like to know about
 * all sites in the Federal Web Presence (i.e., any .gov, .mil domains and subdomains.)
 *
 * The scanner is using Puppeteer for headless scanning. As much as possible, we are trying to use
 * the headless browser for scanning, as it gives us access to outbound requests (required for detecting the
 * presence of the Digital Analystics Program, for example) and other performance metrics. Additionally, it allows
 * us to read more information from a single I/O request.
 */
@Injectable()
export class CoreScanner
  implements Scanner<CoreInputDto, CoreOutputDto>, OnModuleDestroy {
  private browser: Browser;
  constructor(@Inject(BROWSER_TOKEN) browser: Browser) {
    this.browser = browser;
  }

  /**
   * scan starts the headless scan and returns results about the scan.
   *
   * @param input an InputCoreDto. This is a Data Transfer Object that specifies the URL to be scanned and
   * some meta-data about the URL.
   *
   * @returns a ResultCoreDto object that contains the results of the scan.
   */

  async scan(input: CoreInputDto) {
    const page = await this.browser.newPage();
    await page.goto(input.url);

    const finalUrl = page.url();

    const result: CoreOutputDto = {
      targetUrl: input.url,
      agency: input.agency,
      branch: input.branch,
      finalUrl: finalUrl,
    };

    return result;
  }

  /**
   * onModuleDestroy is a lifecycle event in Nest.js.
   *
   * See: https://docs.nestjs.com/fundamentals/lifecycle-events
   */
  async onModuleDestroy() {
    await this.browser.close();
  }
}
