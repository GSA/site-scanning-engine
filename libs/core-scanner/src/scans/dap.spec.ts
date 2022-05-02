import { mock } from 'jest-mock-extended';
import { HTTPRequest } from 'puppeteer';

import { buildDapResult } from './dap';

describe('dap scan', () => {
  it('DAP detected if analytics code in URL', async () => {
    expect(
      await buildDapResult([
        mock<HTTPRequest>({
          url: () => 'abcd-def/UA-33523145-1/xyz',
        }),
      ]),
    ).toEqual({
      dapDetected: true,
      dapParameters: undefined,
    });
  });
  it('DAP detected if analytics code in POST data', async () => {
    expect(
      await buildDapResult([
        mock<HTTPRequest>({
          url: () => 'https://test.gov',
          postData: () => 'abcd-def/UA-33523145-1/xyz',
        }),
      ]),
    ).toEqual({
      dapDetected: true,
      dapParameters: undefined,
    });
  });
  it('DAP parameters extracted from script request', async () => {
    expect(
      await buildDapResult([
        mock<HTTPRequest>({
          url: () =>
            'https://dap.digitalgov.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
        }),
      ]),
    ).toEqual({
      dapDetected: false,
      dapParameters: 'test1=1&test2=2',
    });
  });
});
