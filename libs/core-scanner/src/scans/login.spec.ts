import { mock } from 'jest-mock-extended';
import { HTTPResponse } from 'puppeteer';

import { buildLoginResult } from './login';

describe('login scan', () => {
  it('Detects login strings', async () => {
    const html = `
      <form>
        <input type="password"></input>
      </form>
    `;

    expect(
      await buildLoginResult(
        mock<HTTPResponse>({
          text: async () => html,
        }),
      ),
    ).toEqual({
      loginDetected: '"password",type="password"',
      loginProvider: null,
    });
  });

  it('Detects login providers in href', async () => {
    const html = `
      <a href="id.me">Some Label/a>
    `;

    expect(
      await buildLoginResult(
        mock<HTTPResponse>({
          text: async () => html,
        }),
      ),
    ).toEqual({ loginDetected: null, loginProvider: 'id.me' });
  });

  it('Detects login providers in title', async () => {
    const html = `
      <a href="#" title="Use Login.Gov">Some Label</a>
    `;

    expect(
      await buildLoginResult(
        mock<HTTPResponse>({
          text: async () => html,
        }),
      ),
    ).toEqual({ loginDetected: null, loginProvider: 'login.gov' });
  });

  it('Detects login providers in anchor tag text', async () => {
    const html = `
      <a href="#">Sign In With Login.gov</a>
    `;

    expect(
      await buildLoginResult(
        mock<HTTPResponse>({
          text: async () => html,
        }),
      ),
    ).toEqual({ loginDetected: null, loginProvider: 'login.gov' });
  });
});
