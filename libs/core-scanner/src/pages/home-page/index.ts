import { Logger } from '@nestjs/common';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';

import { getHttpsUrl } from '../helpers';

export const createHomePageScanner = (logger: Logger, input: CoreInputDto) => {
  const url = getHttpsUrl(input.url);
  /*const response = await page.goto(url, {
    waitUntil: 'networkidle2',
  });*/
};
