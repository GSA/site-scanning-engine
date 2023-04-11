import { mock } from 'jest-mock-extended';
import { HTTPResponse } from 'puppeteer';

import { buildRequiredLinksResult } from './required-links';

describe('required links scan', () => {
  it('Detects if the response body has no required links', async () => {
    const mockResonse = mock<HTTPResponse>({
      text: async () => {
        return '<html></html>';
      },
    });

    expect(await buildRequiredLinksResult(mockResonse)).toEqual({
      requiredLinks: '',
    });
  });

  it('Detects if the response has a usa.gov link', async () => {
    const mockResonse = mock<HTTPResponse>({
      text: async () => {
        return '<html><a href="https://www.usa.gov">USA Dot Gov</a></html>';
      },
    });

    expect(await buildRequiredLinksResult(mockResonse)).toEqual({
      requiredLinks: 'usa.gov',
    });
  });

  it('Detects if the response has a foia link', async () => {
    const mockResonse = mock<HTTPResponse>({
      text: async () => {
        return '<html><a href="https://www.foia.gov">USA Dot Gov</a></html>';
      },
    });

    expect(await buildRequiredLinksResult(mockResonse)).toEqual({
      requiredLinks: 'foia',
    });
  });

  it('Detects if the response has a foia link', async () => {
    const mockResonse = mock<HTTPResponse>({
      text: async () => {
        return '<html><a href="https://www.foia.gov">Freedom of Information Act</a></html>';
      },
    });

    expect(await buildRequiredLinksResult(mockResonse)).toEqual({
      requiredLinks: 'foia',
    });
  });

  it('Detects if the response has a both a usa.gov link and a foia link', async () => {
    const mockResonse = mock<HTTPResponse>({
      text: async () => {
        return `<html>
            <a href="https://www.usa.gov">USA Dot Gov</a>
            <a href="https://www.foia.gov">Freedom of Information Act</a>
            </html>`;
      },
    });

    expect(await buildRequiredLinksResult(mockResonse)).toEqual({
      requiredLinks: 'foia,usa.gov',
    });
  });
});
