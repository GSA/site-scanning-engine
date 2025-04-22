import { HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Agent } from 'https';
import { v4 } from 'uuid';
import { lastValueFrom } from 'rxjs';
import { Logger } from 'pino';

import { getHttpsUrl } from '../util';

export const createNotFoundScanner = async (
  httpService: HttpService,
  url: string,
  logger: Logger,
): Promise<boolean> => {
  const childLogger = logger.child({ function: 'createNotFoundScanner' });
  const httpsUrl = getHttpsUrl(url);
  const randomUrl = new URL(httpsUrl);
  randomUrl.pathname = `not-found-test${v4()}`;
  childLogger.info(`Testing URL: ${randomUrl.toString()}`);

  try {
    const agent = new Agent({
      rejectUnauthorized: false, // lgtm[js/disabling-certificate-validation]
    });

    const resp = await lastValueFrom(
      await httpService.get(randomUrl.toString(), {
        timeout: 15000,
        httpsAgent: agent,
      }),
    );
    childLogger.debug({ status: resp.status }, `Got response from URL: ${randomUrl.toString()}`);
    return resp.status === HttpStatus.NOT_FOUND;
  } catch (error) {
    childLogger.error({ error: error.message }, `Error fetching URL: ${randomUrl.toString()}`);
    return false;
  }
  
};