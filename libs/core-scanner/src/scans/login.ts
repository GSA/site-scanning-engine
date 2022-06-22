import { HTTPResponse } from 'puppeteer';

import { LoginScan } from 'entities/scan-data.entity';

const loginStrings = [
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

export const buildLoginResult = async (
  mainResponse: HTTPResponse,
): Promise<LoginScan> => {
  const result = [];
  const html = await mainResponse.text();
  const htmlLower = html.toLowerCase();

  loginStrings.forEach((string) => {
    if (htmlLower.includes(string.toLowerCase())) {
      result.push(string);
    }
  });

  return {
    loginDetected: result.length > 0 ? result.sort().join(',') : null,
  };
};
