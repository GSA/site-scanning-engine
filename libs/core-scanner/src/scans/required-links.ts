import { HTTPResponse } from 'puppeteer';

import { RequiredLinksScan } from 'entities/scan-data.entity';

export const buildRequiredLinksResult = async (
  mainResponse: HTTPResponse,
): Promise<RequiredLinksScan> => {
  const html = await mainResponse.text();

  const requiredLinksUrl = [
    'about',
    'fear',
    'foia',
    'inspector',
    'privacy',
    'usa.gov',
  ]
    .filter((string) => hasStringInHref(html, string))
    .join(',');

  const requiredLinksText = [
    'about us',
    'accessibility',
    'budget and performance',
    'no fear act',
    'foia',
    'freedom of information act',
    'inspector general',
    'privacy policy',
    'vulnerability disclosure',
    'usa.gov',
  ]
    .filter((string) => hasStringInLinkText(html, string))
    .join(',');

  return {
    requiredLinksUrl,
    requiredLinksText,
  };
};

const hasStringInHref = (html: string, string: string): boolean => {
  const hrefs = html.match(/href=['"](.*?)['"]/gi);
  if (!hrefs) return false;
  const matchingHrefs = hrefs.filter((href) =>
    href.toLowerCase().includes(string),
  );
  return matchingHrefs.length > 0 ? true : false;
};

const hasStringInLinkText = (html: string, string: string): boolean => {
  const linkTexts = html.match(/(?<=<a\b[^>]*>)([\s\S]*?)(?=<\/a>)/gi);
  if (!linkTexts) return false;
  const matchingLinkTexts = linkTexts.filter((linkText) =>
    linkText.toLowerCase().includes(string),
  );
  return matchingLinkTexts.length > 0 ? true : false;
};
