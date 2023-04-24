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
      requiredLinksUrl: '',
      requiredLinksText: '',
    });
  });

  it('Detects if the response has multiple required links', async () => {
    const mockResonse = mock<HTTPResponse>({
      text: async () => {
        return `<html>
            <a href="https://www.usa.gov">USA Dot Gov</a>
            <a href="https://18f.gsa.gov/about/">About 18F</a>
            <a href="https://www.gsa.gov/website-information/accessibility-statement">Accessibility Support</a>
            <a href="https://www.foia.gov">Freedom of Information Act</a>
            <a href="https://home.treasury.gov/footer/no-fear-act">No Fear Act</a>
            <a href="https://www.gsaig.gov/">Office of the Inspector General</a>
            <a href="https://www.gsa.gov/website-information/website-policies#privacy">Privacy Policy</a>
            <a href="https://www.gsa.gov/vulnerability-disclosure-policy">Vulnerability Disclosure</a>
            </html>`;
      },
    });

    expect(await buildRequiredLinksResult(mockResonse)).toEqual({
      requiredLinksUrl: 'about,fear,foia,privacy,usa.gov',
      requiredLinksText:
        'accessibility,no fear act,freedom of information act,inspector general,privacy policy,vulnerability disclosure',
    });
  });

  it('Detects if the response has a usa.gov link', async () => {
    const mockResonse = mock<HTTPResponse>({
      text: async () => {
        return '<html><a href="https://www.usa.gov">USA Dot Gov</a></html>';
      },
    });

    expect(await buildRequiredLinksResult(mockResonse)).toEqual({
      requiredLinksUrl: 'usa.gov',
      requiredLinksText: '',
    });
  });

  it('Detects if the response has a foia link', async () => {
    const mockResonse = mock<HTTPResponse>({
      text: async () => {
        return '<html><a href="https://www.foia.gov">Freedom of Information Act</a></html>';
      },
    });

    expect(await buildRequiredLinksResult(mockResonse)).toEqual({
      requiredLinksUrl: 'foia',
      requiredLinksText: 'freedom of information act',
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
      requiredLinksUrl: 'foia,usa.gov',
      requiredLinksText: 'freedom of information act',
    });
  });
});
