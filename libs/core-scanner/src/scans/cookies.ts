import { uniq } from 'lodash';
import { Page } from 'puppeteer';

import { CookieScan } from 'entities/scan-data.entity';

export const buildCookieResult = async (page: Page): Promise<CookieScan> => {
  return {
    domains: await cookieDomains(page),
  };
};

const cookieDomains = async (page: Page) => {
  const client = (page as any)._client;
  const result = await client.send('Network.getAllCookies');
  const domains = uniq(result.cookies.map((cookie) => cookie.domain)).sort();
  return domains.join(',');
};
