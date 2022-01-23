import { uniq } from 'lodash';
import { Request, Response } from 'puppeteer';

export const buildThirdPartyResult = async (
  mainResponse: Response,
  outboundRequests: Request[],
) => {
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
  outboundRequests: Request[],
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
  const deduped = uniq(thirdPartyDomains).filter(Boolean);
  return {
    domains: deduped.join(','),
    count: deduped.length,
  };
};

interface ThirdPartyServicesResult {
  domains: string;
  count: number;
}
