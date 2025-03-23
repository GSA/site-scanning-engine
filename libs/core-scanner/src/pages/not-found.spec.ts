import { mock } from 'jest-mock-extended';
import { createNotFoundScanner } from './not-found';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import pino from 'pino';

const mockLogger = pino();

describe('not-found scan', () => {
  it('returns true when the page is not found', async () => {
    const mockHttpService = mock<HttpService>();
    const response: AxiosResponse<any> = {
      data: {},
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config: {
        headers: null,
      },
    };

    jest
      .spyOn(mockHttpService, 'get')
      .mockImplementationOnce(() => of(response));

    const result = await createNotFoundScanner(
      mockHttpService,
      'gsa.gov/some-page',
      mockLogger,
    );
    expect(result).toEqual(true);
  });

  it('returns false when the page is found', async () => {
    const mockHttpService = mock<HttpService>();
    const response: AxiosResponse<any> = {
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: null,
      },
    };

    jest
      .spyOn(mockHttpService, 'get')
      .mockImplementationOnce(() => of(response));

    const result = await createNotFoundScanner(mockHttpService, 'gsa.gov', mockLogger);
    expect(result).toEqual(false);
  });
});
