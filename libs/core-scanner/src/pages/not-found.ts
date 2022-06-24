import { HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Agent } from 'https';
import { v4 } from 'uuid';

import { getHttpsUrl } from '../util';

export const createNotFoundScanner = async (
  httpService: HttpService,
  url: string,
): Promise<boolean> => {
  const httpsUrl = getHttpsUrl(url);
  const randomUrl = new URL(httpsUrl);
  randomUrl.pathname = `not-found-test${v4()}`;

  const agent = new Agent({
    rejectUnauthorized: false, // lgtm[js/disabling-certificate-validation]
  });

  const resp = await httpService
    .get(randomUrl.toString(), {
      validateStatus: () => {
        return true;
      },
      httpsAgent: agent,
    })
    .toPromise();

  return resp.status == HttpStatus.NOT_FOUND;
};
