import { uniq } from 'lodash';
import { HTTPRequest, HTTPResponse } from 'puppeteer';

import { ThirdPartyScan } from 'entities/scan-data.entity';

export const buildThirdPartyResult = async (
  mainResponse: HTTPResponse,
  outboundRequests: HTTPRequest[],
): Promise<ThirdPartyScan> => {
  const url = mainResponse && mainResponse.url();
  const thirdPartyResult = await thirdPartyServices(outboundRequests, url);
  return {
    thirdPartyServiceDomains: thirdPartyResult.domains,
    thirdPartyServiceCount: thirdPartyResult.count,
  };
};

const thirdPartyServices = (
  outboundRequests: HTTPRequest[],
  finalUrl: string,
): {
  domains: string;
  count: number;
} => {
  const parsedUrl = new URL(finalUrl);
  const thirdPartyDomains = [];

  for (const request of outboundRequests) {
    const url = request && new URL(request.url());
    if (parsedUrl.hostname != url.hostname && !request.isNavigationRequest()) {
      thirdPartyDomains.push(url.hostname);
    }
  }
  const deduped = uniq(thirdPartyDomains).filter(Boolean).sort();
  return {
    domains: deduped.join(','),
    count: deduped.length,
  };
};
