import { HTTPResponse } from 'puppeteer';

import { CloudDotGovPagesScan } from 'entities/scan-data.entity';

export const buildCloudDotGovPagesResult = async (
  mainResponse: HTTPResponse,
): Promise<CloudDotGovPagesScan> => {
  const headers = mainResponse.headers();
  const cloudDotGovPages =
    (headers['x-server'] &&
      headers['x-server'].toLowerCase() === 'cloud.gov pages') ??
    false;

  return {
    cloudDotGovPages,
  };
};
