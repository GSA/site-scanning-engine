import { BROWSER_TOKEN } from '@app/browser';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { CoreInputDto } from 'common/dtos/scanners/core.input.dto';
import { CoreOutputDto } from 'common/dtos/scanners/core.output.dto';
import { Scanner } from 'common/interfaces/scanner.interface';
import { Browser } from 'puppeteer';

@Injectable()
export class CoreScannerService
  implements Scanner<CoreInputDto, CoreOutputDto>, OnModuleDestroy {
  constructor(@Inject(BROWSER_TOKEN) private browser: Browser) {}

  async scan(input: CoreInputDto) {
    const page = await this.browser.newPage();
    await page.goto(input.url);

    const finalUrl = page.url();

    const result: CoreOutputDto = {
      websiteId: input.websiteId,
      finalUrl: finalUrl,
    };

    return result;
  }

  async onModuleDestroy() {
    await this.browser.close();
  }
}
