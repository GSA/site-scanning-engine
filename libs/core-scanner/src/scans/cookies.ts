import { uniq } from 'lodash';
import { Page } from 'puppeteer';

import { CookieScan } from 'entities/scan-data.entity';

export const buildCookieResult = async (page: Page): Promise<CookieScan> => {
  return {
    domains: await cookieDomains(page),
  };
};

const cookieDomains = async (page: Page): Promise<string> => {
  const cookies = await page.cookies();
  const cookieDomains = uniq(
    cookies.map((cookieObj) => cookieObj.domain),
  ).sort();

  return cookieDomains.join(',');
};
