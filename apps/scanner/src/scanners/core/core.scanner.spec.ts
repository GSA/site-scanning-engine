import { Test, TestingModule } from '@nestjs/testing';
import { Browser, Page, Response } from 'puppeteer';
import { CoreScanner } from './core.scanner';
import { BROWSER_TOKEN } from '../browser.provider';
import { mock, mockReset, MockProxy } from 'jest-mock-extended';
import { InputCoreDto } from './input-core.dto';

describe('CoreScanner', () => {
  let provider: CoreScanner;
  let module: TestingModule;
  let mockBrowser: MockProxy<Browser>;
  let mockPage: MockProxy<Page>;
  let mockResponse: MockProxy<Response>;

  const inputDto: InputCoreDto = {
    url: 'https://18f.gov',
    agency: 'GSA',
    branch: 'Executive',
  };

  beforeEach(async () => {
    mockBrowser = mock<Browser>();
    mockPage = mock<Page>();
    mockResponse = mock<Response>();
    module = await Test.createTestingModule({
      providers: [
        CoreScanner,
        {
          provide: BROWSER_TOKEN,
          useFactory: async () => {
            return mockBrowser;
          },
        },
      ],
    }).compile();

    provider = module.get<CoreScanner>(CoreScanner);
  });

  afterEach(async () => {
    mockReset(mockBrowser);
    mockReset(mockPage);
    mockReset(mockResponse);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('page should return final url', async () => {
    const finalUrl = 'https://18f.gsa.gov';
    mockPage.goto.calledWith(inputDto.url).mockResolvedValue(mockResponse);
    mockPage.url.calledWith().mockReturnValue(finalUrl);
    mockBrowser.newPage.calledWith().mockResolvedValue(mockPage);

    const result = await provider.scan(inputDto);
    expect(result.finalUrl).toStrictEqual(finalUrl);
  });
});
