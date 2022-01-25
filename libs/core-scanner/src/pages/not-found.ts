import { HttpService, HttpStatus } from '@nestjs/common';
import { Agent } from 'https';
import { v4 } from 'uuid';

export const createNotFoundScanner = async (
  httpService: HttpService,
  url: string,
) => {
  const randomUrl = new URL(url);
  randomUrl.pathname = `not-found-test${v4()}`;

  const agent = new Agent({
    rejectUnauthorized: false,
  });

  const resp = await httpService
    .get(randomUrl.toString(), {
      validateStatus: (_) => {
        return true;
      },
      httpsAgent: agent,
    })
    .toPromise();

  return resp.status == HttpStatus.NOT_FOUND;
};
