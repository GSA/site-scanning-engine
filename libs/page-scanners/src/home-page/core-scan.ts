import { HttpService, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';

import { SolutionsInputDto } from '@app/solutions-scanner/solutions.input.dto';

import { getHttpsUrl } from '../helpers';
import { notFoundTest } from '../scans/not-found';
import { buildCoreResult } from '../scans/core';

export const coreScan = async (
  httpService: HttpService,
  logger: Logger,
  input: SolutionsInputDto,
  page: Page,
) => {
  const url = getHttpsUrl(input.url);
  const logData = {
    ...input,
  };

  // load the url
  logger.debug({ msg: `loading ${url}`, ...logData });
  const response = await page.goto(url, {
    waitUntil: 'networkidle2',
  });

  // do the redirect test
  const notFound = await notFoundTest(httpService, url);

  // construct the CoreResult
  return buildCoreResult(input, notFound, page, response);
};
