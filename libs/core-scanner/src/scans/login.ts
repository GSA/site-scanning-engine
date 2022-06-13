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

  loginStrings.forEach((string) => {
    if (html.includes(string)) {
      result.push(string);
    }
  });

  return {
    loginDetected: result.sort().join(','),
  };
};
