import { mock } from 'jest-mock-extended';
import { Logger } from 'pino';
import { HTTPRequest } from 'puppeteer';

import { buildDapResult } from './dap';

describe('dap scan', () => {
  it('DAP detected if analytics code in URL', async () => {
    expect(
      await buildDapResult(mock<Logger>(), [
        mock<HTTPRequest>({
          url: () => 'abcd-def/UA-33523145-1/xyz',
        }),
      ]),
    ).toEqual({
      dapDetected: true,
      dapParameters: null,
    });
  });

  it('DAP detected if an analytics code is in POST data', async () => {
    expect(
      await buildDapResult(mock<Logger>(), [
        mock<HTTPRequest>({
          url: () => 'https://test.gov',
          postData: () => 'abcd-def/UA-33523145-1/xyz',
        }),
      ]),
    ).toEqual({
      dapDetected: true,
      dapParameters: null,
    });
  });

  it('DAP detected if another analytics code is in POST data', async () => {
    expect(
      await buildDapResult(mock<Logger>(), [
        mock<HTTPRequest>({
          url: () => 'https://test.gov',
          postData: () => 'abcd-def/G-9TNNMGP8WJ/xyz',
        }),
      ]),
    ).toEqual({
      dapDetected: true,
      dapParameters: null,
    });
  });

  it('DAP parameters extracted from script hosted remotely', async () => {
    expect(
      await buildDapResult(mock<Logger>(), [
        mock<HTTPRequest>({
          url: () =>
            'https://dap.digitalgov.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
        }),
      ]),
    ).toEqual({
      dapDetected: true,
      dapParameters: 'test1=1&test2=2',
    });
  });

  it('DAP parameters extracted from script hosted on the website', async () => {
    expect(
      await buildDapResult(mock<Logger>(), [
        mock<HTTPRequest>({
          url: () =>
            'https://test.gov/Universal-Federated-Analytics-Min.js?test1=1&test2=2',
        }),
      ]),
    ).toEqual({
      dapDetected: true,
      dapParameters: 'test1=1&test2=2',
    });
  });
});
