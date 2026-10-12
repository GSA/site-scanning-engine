import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { DeepMockProxy, mock, MockProxy } from 'jest-mock-extended';
import { HTTPRequest, HTTPResponse, Page } from 'puppeteer';
import { of } from 'rxjs';

import { CoreInputDto } from '../core.input.dto';

/** Scan input shared by page-scanner specs that target 18f.gov. */
export const testInput: CoreInputDto = {
  websiteId: 1,
  url: '18f.gov',
  filter: false,
  pageviews: 1,
  visits: 1,
  scanId: '123',
};

/**
 * Stubs a navigation to https://18f.gov that redirects once and lands on
 * `finalUrl` with a 200 response.
 *
 * @param page Mocked page; `goto('https://18f.gov')` and `url()` are wired on it.
 * @param contentType Value returned for the response's Content-Type header.
 * @param finalUrl Value returned by `page.url()` after navigation.
 * @returns The request/response mocks so specs can add per-test stubs.
 */
export function stubRedirectedNavigation(
  page: MockProxy<Page> | DeepMockProxy<Page>,
  contentType: string,
  finalUrl: string,
) {
  const mockResponse = mock<HTTPResponse>();
  const mockRequest = mock<HTTPRequest>();
  const redirectRequest = mock<HTTPRequest>();

  redirectRequest.url.calledWith().mockReturnValue('https://18f.gov');
  mockRequest.redirectChain.calledWith().mockReturnValue([redirectRequest]);
  mockResponse.request.calledWith().mockReturnValue(mockRequest);
  mockResponse.status.calledWith().mockReturnValue(200);
  mockResponse.headers.calledWith().mockReturnValue({
    'Content-Type': contentType,
  });
  page.goto.calledWith('https://18f.gov').mockResolvedValue(mockResponse);
  page.url.calledWith().mockReturnValue(finalUrl);

  return { mockRequest, redirectRequest, mockResponse };
}

/**
 * Makes the next `httpService.get()` call emit an empty response with the
 * given status. Only the first call is stubbed.
 */
export function stubHttpGet(
  httpService: MockProxy<HttpService>,
  status: number,
  statusText: string,
) {
  const response: AxiosResponse<any> = {
    data: {},
    status,
    statusText,
    headers: {},
    config: {
      headers: null,
    },
  };

  jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(response));
}
