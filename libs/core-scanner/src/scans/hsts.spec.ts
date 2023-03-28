import { mock } from 'jest-mock-extended';
import { HTTPResponse } from 'puppeteer';

import { buildHstsResult } from './hsts';

describe('hsts scan', () => {
  it('Detects if the response includes an hsts header', async () => {
    expect(
      await buildHstsResult(
        mock<HTTPResponse>({
          headers: () => {
            return { 'Strict-Transport-Security': 'max-age=31536000' };
          },
        }),
      ),
    ).toEqual({ hsts: true });
  });

  it('Detects if the response does not include an hsts header', async () => {
    expect(
      await buildHstsResult(
        mock<HTTPResponse>({
          headers: () => {
            return {};
          },
        }),
      ),
    ).toEqual({ hsts: false });
  });
});
