import { Logger } from '@nestjs/common';

import { SolutionsInputDto } from '@app/solutions-scanner/solutions.input.dto';

import { getHttpsUrl } from '../helpers';

export const createHomePageScanner = (
  logger: Logger,
  input: SolutionsInputDto,
) => {
  const url = getHttpsUrl(input.url);
  /*const response = await page.goto(url, {
    waitUntil: 'networkidle2',
  });*/
};
