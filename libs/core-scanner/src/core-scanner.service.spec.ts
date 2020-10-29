import { BROWSER_TOKEN } from '@app/browser';
import { LoggerService } from '@app/logger';
import { Test, TestingModule } from '@nestjs/testing';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { mock, MockProxy } from 'jest-mock-extended';
import { Browser, Page, Response, Request } from 'puppeteer';
import { CoreScannerService } from './core-scanner.service';
import { CoreOutputDto } from './core.output.dto';

describe('CoreScannerService', () => {
  let service: CoreScannerService;
  let mockBrowser: MockProxy<Browser>;
  let mockPage: MockProxy<Page>;
  let mockResponse: MockProxy<Response>;
  let mockLogger: MockProxy<LoggerService>;
  let mockRequest: MockProxy<Request>;
  let redirectRequest: MockProxy<Request>;
  const finalUrl = 'https://18f.gsa.gov';

  beforeEach(async () => {
    mockBrowser = mock<Browser>();
    mockPage = mock<Page>();
    mockResponse = mock<Response>();
    mockLogger = mock<LoggerService>();
    mockRequest = mock<Request>();
    redirectRequest = mock<Request>();

    redirectRequest.url.calledWith().mockReturnValue('https://18f.gov');
    mockRequest.redirectChain.calledWith().mockReturnValue([redirectRequest]);
    mockResponse.request.calledWith().mockReturnValue(mockRequest);
    mockResponse.status.calledWith().mockReturnValue(200);
    mockResponse.headers.calledWith().mockReturnValue({
      'Content-Type': 'text/html',
    });
    mockPage.goto.calledWith('https://18f.gov').mockResolvedValue(mockResponse);
    mockPage.url.calledWith().mockReturnValue(finalUrl);
    mockBrowser.newPage.calledWith().mockResolvedValue(mockPage);

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

  it('should return a CoreOutputDto with the correct fields', async () => {
    const coreInputDto: CoreInputDto = {
      websiteId: 1,
      url: 'https://18f.gov',
    };

    const result = await service.scan(coreInputDto);
    const expected: CoreOutputDto = {
      websiteId: 1,
      finalUrl: finalUrl,
      finalUrlBaseDomain: 'gsa.gov',
      targetUrlBaseDomain: '18f.gov',
      finalUrlIsLive: true,
      finalUrlMIMEType: 'text/html',
      targetUrlRedirects: true,
      finalUrlSameDomain: false,
      finalUrlSameWebsite: false,
    };

    expect(result).toStrictEqual(expected);
  });

  it('should close the page after scanning', async () => {
    const coreInputDto: CoreInputDto = {
      websiteId: 1,
      url: 'https://18f.gov',
    };
    mockBrowser.newPage.calledWith().mockResolvedValue(mockPage);
    await service.scan(coreInputDto);

    expect(mockPage.close).toHaveBeenCalled();
  });

  it('closes the browser onModuleDestroy lifecycle event', async () => {
    await service.onModuleDestroy();
    expect(mockBrowser.close).toHaveBeenCalled();
  });
});
