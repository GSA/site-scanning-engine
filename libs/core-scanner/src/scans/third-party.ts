import { uniq } from 'lodash';
import { HTTPRequest, HTTPResponse } from 'puppeteer';

import { ThirdPartyScan } from 'entities/scan-data.entity';

export const buildThirdPartyResult = async (
  mainResponse: HTTPResponse,
  outboundRequests: HTTPRequest[],
): Promise<ThirdPartyScan> => {
  const thirdPartyResult = thirdPartyServices(
    outboundRequests,
    mainResponse.url(),
  );
  return {
    thirdPartyServiceDomains: thirdPartyResult.domains,
    thirdPartyServiceCount: thirdPartyResult.count,
  };
};

const thirdPartyServices = (
  outboundRequests: HTTPRequest[],
  finalUrl: string,
): ThirdPartyServicesResult => {
  const parsedUrl = new URL(finalUrl);
  const thirdPartyDomains = [];

  for (const request of outboundRequests) {
    const url = new URL(request.url());
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

interface ThirdPartyServicesResult {
  domains: string;
  count: number;
}
