import { UrlList } from './url-list';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { mock } from 'jest-mock-extended';
import { of } from 'rxjs';

describe('UrlList', () => {
  let urlList: UrlList;

  beforeEach(() => {
    const mockHttpService = mock<HttpService>();
    const mockConfigService = mock<ConfigService>();

    jest.spyOn(mockHttpService, 'get').mockImplementationOnce(() =>
      of({
        data: 'https://www.usa.gov\nhttps://www.usa.gov/other\nhttps://www.usa.gov/other/other',
        headers: { url: 'https://www.usa.gov' },
        config: { headers: null },
        status: 200,
        statusText: 'OK',
      }),
    );

    urlList = new UrlList(mockHttpService, mockConfigService);
  });

  it('should be defined', () => {
    expect(urlList).toBeDefined();
  });

  it('should fetch a list of URLs', async () => {
    const result = await urlList.fetch();
    expect(result).toBe(
      'https://www.usa.gov\nhttps://www.usa.gov/other\nhttps://www.usa.gov/other/other',
    );
  });
});
