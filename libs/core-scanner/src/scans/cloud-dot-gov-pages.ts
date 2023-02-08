import { HTTPResponse } from 'puppeteer';

import { CloudDotGovPagesScan } from 'entities/scan-data.entity';

export const buildCloudDotGovPagesResult = async (
  mainResponse: HTTPResponse,
): Promise<CloudDotGovPagesScan> => {
  let cloudDotGovPages = false;
  const headers = mainResponse.headers();

  if (
    headers['x-server'] &&
    headers['x-server'].toLowerCase() === 'cloud.gov pages'
  ) {
    cloudDotGovPages = true;
  }

  return {
    cloudDotGovPages,
  };
};
