import { HTTPResponse } from 'puppeteer';

import { HstsScan } from 'entities/scan-data.entity';

export const buildHstsResult = async (
  mainResponse: HTTPResponse,
): Promise<HstsScan> => {
  const headers = mainResponse.headers();
  return {
    hsts:
      headers['Strict-Transport-Security'] ||
      headers['strict-transport-security']
        ? true
        : false,
  };
};
