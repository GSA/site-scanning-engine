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
    ).toEqual({ loginDetected: '"password",type="password"' });
  });
});
