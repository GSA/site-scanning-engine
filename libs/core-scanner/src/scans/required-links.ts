import { HTTPResponse } from 'puppeteer';

import { RequiredLinksScan } from 'entities/scan-data.entity';

export const buildRequiredLinksResult = async (
  mainResponse: HTTPResponse,
): Promise<RequiredLinksScan> => {
  const html = await mainResponse.text();
  const requiredLinksUrl = [];
  const requiredLinksText = [];

  if (hasStringInHref(html, 'about')) requiredLinksUrl.push('about');
  if (hasStringInHref(html, 'fear')) requiredLinksUrl.push('fear');
  if (hasStringInHref(html, 'foia')) requiredLinksUrl.push('foia');
  if (hasStringInHref(html, 'inspector')) requiredLinksUrl.push('inspector');
  if (hasStringInHref(html, 'privacy')) requiredLinksUrl.push('privacy');
  if (hasStringInHref(html, 'usa.gov')) requiredLinksUrl.push('usa.gov');

  if (hasStringInLinkText(html, 'about us')) requiredLinksText.push('about');
  if (hasStringInLinkText(html, 'accessibility'))
    requiredLinksText.push('accessibility');
  if (hasStringInLinkText(html, 'budget and performance'))
    requiredLinksText.push('budget');
  if (hasStringInLinkText(html, 'no fear act')) requiredLinksText.push('fear');
  if (
    hasStringInLinkText(html, 'foia') ||
    hasStringInLinkText(html, 'freedom of information act')
  )
    requiredLinksText.push('foia');
  if (hasStringInLinkText(html, 'inspector general'))
    requiredLinksText.push('inspector');
  if (hasStringInLinkText(html, 'privacy policy'))
    requiredLinksText.push('privacy');
  if (hasStringInLinkText(html, 'vulnerability disclosure'))
    requiredLinksText.push('vulnerability');

  return {
    requiredLinksUrl: requiredLinksUrl.join(','),
    requiredLinksText: requiredLinksText.join(','),
  };
};

const hasStringInHref = (html: string, string: string): boolean => {
  const hrefRegex = new RegExp(/href=['"](.*?)['"]/g);
  const hrefs = html.match(hrefRegex);
  if (!hrefs) return false;
  const matchingHrefs = hrefs.filter((href) =>
    href.toLowerCase().includes(string),
  );
  return matchingHrefs.length > 0 ? true : false;
};

const hasStringInLinkText = (html: string, string: string): boolean => {
  const linkTextRegex = new RegExp(/<a[^>]*>(.*?)<\/a>/g);
  const linkTexts = html.match(linkTextRegex);
  if (!linkTexts) return false;
  const matchingLinkTexts = linkTexts.filter((linkText) =>
    linkText.toLowerCase().includes(string),
  );
  return matchingLinkTexts.length > 0 ? true : false;
};
