import { HTTPResponse } from 'puppeteer';

import { LoginScan } from 'entities/scan-data.entity';

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

const loginProviderStrings = ['id.me', 'login.gov'];

export const buildLoginResult = async (
  mainResponse: HTTPResponse,
): Promise<LoginScan> => {
  const html = await mainResponse.text();
  const htmlLower = html.toLowerCase();

  return {
    loginDetected: getLoginDetectedResults(htmlLower),
    loginProvider: getLoginProviderResults(htmlLower),
  };
};

const getLoginDetectedResults = (html: string) => {
  const results = [];
  loginDetectedStrings.forEach((string) => {
    if (html.includes(string.toLowerCase())) {
      results.push(string);
    }
  });
  return results.length > 0 ? results.sort().join(',') : null;
};

const getLoginProviderResults = (html: string) => {
  const results = [];

  const hrefs = html.match(/href=['"](.*?)['"]/gi);
  if (hrefs) {
    loginProviderStrings.forEach((string) => {
      const matchingHrefs = hrefs.filter((href) =>
        href.toLowerCase().includes(string),
      );

      if (matchingHrefs.length > 0) {
        results.push(string);
      }
    });
  }

  const linkTexts = html.match(/(?<=<a\b[^>]*>)([\s\S]*?)(?=<\/a>)/gi);
  if (linkTexts) {
    loginProviderStrings.forEach((string) => {
      const matchingLinkTexts = linkTexts.filter((href) =>
        href.toLowerCase().includes(string),
      );

      if (matchingLinkTexts.length > 0) {
        results.push(string);
      }
    });
  }

  const uniqueResults = [...new Set(results)];

  return uniqueResults.length > 0 ? uniqueResults.sort().join(',') : null;
};
