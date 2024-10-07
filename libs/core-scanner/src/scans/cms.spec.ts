import { mock } from 'jest-mock-extended';
import { HTTPResponse } from 'puppeteer';

import { buildCmsResult } from './cms';

import pino from 'pino';

const mockLogger = pino();

describe('cms scan', () => {
  it('Detects if the site does not use a cms', async () => {
    const html = `
      <form>
      <input type="password"></input>
      </form>
    `;
    expect(
      await buildCmsResult(
        mockLogger,
        mock<HTTPResponse>({
          headers: () => {
            return {};
          },
          text: async () => html,
        }),
      ),
    ).toEqual({ cms: null });
  });

  it('Detects if the site uses a cms by way of html markup', async () => {
    const html = `
        <link rel="stylesheet" href="/papaya-themes/">
    `;
    expect(
      await buildCmsResult(
        mockLogger,
        mock<HTTPResponse>({
          headers: () => {
            return {};
          },
          text: async () => html,
        }),
      ),
    ).toEqual({ cms: 'papaya CMS' });
  });

  it('Detects if the site uses a cms by way of http response headers with a given value', async () => {
    expect(
      await buildCmsResult(
        mockLogger,
        mock<HTTPResponse>({
          headers: () => {
            return { 'X-Pingback': '/xmlrpc.php' };
          },
          text: async () => '<html></html>',
        }),
      ),
    ).toEqual({ cms: 'WordPress' });
  });

  it('Detects if the site uses a cms by way of http response headers with a given key', async () => {
    expect(
      await buildCmsResult(
        mockLogger,
        mock<HTTPResponse>({
          headers: () => {
            return { DNNOutputCache: 'yadda' };
          },
          text: async () => '<html></html>',
        }),
      ),
    ).toEqual({ cms: 'DNN' });
  });
});
