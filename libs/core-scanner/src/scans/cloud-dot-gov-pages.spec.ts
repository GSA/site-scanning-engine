import { mock } from 'jest-mock-extended';
import { HTTPResponse } from 'puppeteer';

import { buildCloudDotGovPagesResult } from './cloud-dot-gov-pages';

describe('cloud.gov pages scan', () => {
  it('Detects if the site uses cloud.gov pages', async () => {
    expect(
      await buildCloudDotGovPagesResult(
        mock<HTTPResponse>({
          headers: () => {
            return { 'x-server': 'Cloud.gov Pages' };
          },
        }),
      ),
    ).toEqual({ cloudDotGovPages: true });
  });

  it('Detects if the site does not use cloud.gov pages', async () => {
    expect(
      await buildCloudDotGovPagesResult(
        mock<HTTPResponse>({
          headers: () => {
            return { 'x-someheader': 'somevalue' };
          },
        }),
      ),
    ).toEqual({
      cloudDotGovPages: false,
    });
  });
});
