import { mock } from 'jest-mock-extended';
import { HTTPResponse } from 'puppeteer';

import { buildCmsResult } from './cms';

describe('cms scan', () => {
  it('Detects if the site uses a cms', async () => {
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

  it('Detects if the site uses a cms and there are multiple regex to test against', async () => {
    const html = `
        <link rel="stylesheet" href="/wp-content/">
    `;
    expect(
      await buildCmsResult(
        mock<HTTPResponse>({
          text: async () => html,
        }),
      ),
    ).toEqual({ cms: 'WordPress' });
  });

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
});
