import { mock } from 'jest-mock-extended';
import { HTTPResponse } from 'puppeteer';

import { buildCmsResult } from './cms';

describe('cms scan', () => {
  it('Detects if the site does not use a cms', async () => {
    const html = `
      <form>
      <input type="password"></input>
      </form>
    `;
    expect(
      await buildCmsResult(
        mock<HTTPResponse>({
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
        mock<HTTPResponse>({
          text: async () => html,
        }),
      ),
    ).toEqual({ cms: 'papaya CMS' });
  });

  it('Detects if the site uses a cms by way of http response headers', async () => {
    expect(
      await buildCmsResult(
        mock<HTTPResponse>({
          headers: () => {
            return { 'X-Pingback': '/xmlrpc.php' };
          },
          text: async () => '<html></html>',
        }),
      ),
    ).toEqual({ cms: 'WordPress' });
  });
});
