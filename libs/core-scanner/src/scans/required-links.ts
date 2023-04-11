import { HTTPResponse } from 'puppeteer';

import { RequiredLinksScan } from 'entities/scan-data.entity';

export const buildRequiredLinksResult = async (
  mainResponse: HTTPResponse,
): Promise<RequiredLinksScan> => {
  const html = await mainResponse.text();
  const requiredLinks = [];

  if (hasStringInHref(html, 'about')) requiredLinks.push('about');
  if (hasStringInHref(html, 'foia')) requiredLinks.push('foia');
  if (hasStringInHref(html, 'privacy')) requiredLinks.push('privacy');
  if (hasStringInHref(html, 'usa.gov')) requiredLinks.push('usa.gov');

  return {
    requiredLinks: requiredLinks.join(','),
  };
};

const hasStringInHref = (html: string, string: string): boolean => {
  const hrefRegex = new RegExp(/href="(.*?)"/g);
  const hrefs = html.match(hrefRegex);
  if (!hrefs) return false;
  const matchingHrefs = hrefs.filter((href) => href.includes(string));
  return matchingHrefs.length > 0 ? true : false;
};
