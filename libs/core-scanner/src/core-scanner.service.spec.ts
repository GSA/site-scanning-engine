import { BROWSER_TOKEN } from '@app/browser';
import { LoggerService } from '@app/logger';
import { Test, TestingModule } from '@nestjs/testing';
import { CoreInputDto } from 'common/dtos/scanners/core.input.dto';
import { mock, MockProxy } from 'jest-mock-extended';
import { Browser, Page, Response, Request } from 'puppeteer';
import { CoreScannerService } from './core-scanner.service';

describe('CoreScannerService', () => {
  let service: CoreScannerService;
  let mockBrowser: MockProxy<Browser>;
  let mockPage: MockProxy<Page>;
  let mockResponse: MockProxy<Response>;
  let mockLogger: MockProxy<LoggerService>;
  let mockRequest: MockProxy<Request>;
  let redirectRequest: MockProxy<Request>;

  beforeEach(async () => {
    mockBrowser = mock<Browser>();
    mockPage = mock<Page>();
    mockResponse = mock<Response>();
    mockLogger = mock<LoggerService>();
    mockRequest = mock<Request>();
    redirectRequest = mock<Request>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoreScannerService,
        {
          provide: BROWSER_TOKEN,
          useValue: mockBrowser,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<CoreScannerService>(CoreScannerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return final url', async () => {
    const coreInputDto: CoreInputDto = {
      websiteId: 1,
      url: 'https://18f.gov',
    };
    const finalUrl = 'https://18f.gsa.gov';

    redirectRequest.url.calledWith().mockReturnValue('https://18f.gov');
    mockRequest.redirectChain.calledWith().mockReturnValue([redirectRequest]);
    mockResponse.request.calledWith().mockReturnValue(mockRequest);

    mockPage.goto.calledWith('https://18f.gov').mockResolvedValue(mockResponse);
    mockPage.url.calledWith().mockReturnValue(finalUrl);
    mockBrowser.newPage.calledWith().mockResolvedValue(mockPage);

    const result = await service.scan(coreInputDto);
    expect(result.finalUrl).toStrictEqual(finalUrl);
  });

  it('closes the browser onModuleDestory lifecycle event', async () => {
    await service.onModuleDestroy();
    expect(mockBrowser.close).toHaveBeenCalled();
  });
});
