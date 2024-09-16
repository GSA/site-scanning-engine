import { mock } from 'jest-mock-extended';
import { HTTPRequest, HTTPResponse } from 'puppeteer';
import pino from 'pino';

import { buildThirdPartyResult } from './third-party';

const mockLogger = pino();

describe('third-party scan', () => {
  it('non-navigation different domains treated as third-parties', async () => {
    expect(
      await buildThirdPartyResult(
        mockLogger,
        mock<HTTPResponse>({
          url: () => 'https://www.18f.gov/',
        }),
        [
          mock<HTTPRequest>({
            url: () => 'https://www.18f.gov/',
            isNavigationRequest: () => false,
          }),
          mock<HTTPRequest>({
            url: () => 'https://www.18f.gov/',
            isNavigationRequest: () => true,
          }),
          mock<HTTPRequest>({
            url: () => 'https://google.com/',
            isNavigationRequest: () => false,
          }),
          mock<HTTPRequest>({
            url: () => 'https://test.com/',
            isNavigationRequest: () => false,
          }),
          mock<HTTPRequest>({
            url: () => 'https://navrequest1.com/',
            isNavigationRequest: () => true,
          }),
          mock<HTTPRequest>({
            url: () => 'https://navrequest2.com/',
            isNavigationRequest: () => true,
          }),
        ],
      ),
    ).toEqual({
      thirdPartyServiceCount: 2,
      thirdPartyServiceDomains: 'google.com,test.com',
      thirdPartyServiceUrls: 'https://google.com/,https://test.com/',
    });
  });
});
