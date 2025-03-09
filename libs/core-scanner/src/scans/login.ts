import { HTTPResponse } from 'puppeteer';

import { LoginScan } from 'entities/scan-data.entity';

import { Logger } from 'pino';

const loginDetectedStrings = [
  'type="password"',
  '>Sign In<',
  'id="new_user"',
  '"forgot_your_password"',
  'Forgot your Password?',
  '>Show Password</a>',
  '"user_password"',
  '"user_email"',
  '>Forgot Password</a>',
  '>Forgot User ID</a>',
  'showpassword',
  'Create Account',
  '"userid"',
  '"password"',
];

const loginProviderStrings = [
  'id.me',
  'login.gov',
  'sams.cdc.gov',
  'orcid',
  'accounts.google.com',
  'login.live.com',
  'login.microsoftonline.com',
  '.okta.com',
  'auth.nih.gov',
  'account.ncbi.nlm.nih.gov',
  'secureauth',
];

export async function buildLoginResult ( parentLogger: Logger, mainResponse: HTTPResponse ): Promise<LoginScan> {
  const html = mainResponse ? await mainResponse.text() : '';
  const htmlLower = html.toLowerCase();

  const loginDetected = getLoginDetectedResults(htmlLower);
  const loginProvider = getLoginProviderResults(htmlLower);

  return {
    loginDetected,
    loginProvider,
  };
};

const getLoginDetectedResults = (html: string): string | null => {
  const results = [];

  loginDetectedStrings.forEach((string) => {
    if (html.includes(string.toLowerCase())) {
      results.push(string);
    }
  });

  return formatResults(results);
};

const getLoginProviderResults = (html: string): string | null => {
  const results = [];
  const anchorElements = html.match(/<a\b([^>]*)>(.*?)<\/a>/gi);

  if (anchorElements) {
    loginProviderStrings.forEach((string) => {
      const matchingAnchorEls = anchorElements.filter((el) =>
        el.toLowerCase().includes(string),
      );

      if (matchingAnchorEls.length > 0) {
        results.push(string);
      }
    });
  }

  return formatResults(results);
};

const formatResults = (arr: string[]): string | null => {
  const uniqueArr = [...new Set(arr)];
  return uniqueArr.length > 0 ? uniqueArr.sort().join(',') : null;
};
