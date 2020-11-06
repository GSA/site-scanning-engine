import { BROWSER_TOKEN } from '@app/browser';
import { LoggerService } from '@app/logger';
import { Test, TestingModule } from '@nestjs/testing';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { mock, MockProxy } from 'jest-mock-extended';
import { Browser, Page, Response, Request } from 'puppeteer';
import { CoreScannerService } from './core-scanner.service';
import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { ScanStatus } from './scan-status';
import { HttpModule, HttpService } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';

describe('CoreScannerService', () => {
  let service: CoreScannerService;
  let mockBrowser: MockProxy<Browser>;
  let mockPage: MockProxy<Page>;
  let mockResponse: MockProxy<Response>;
  let mockLogger: MockProxy<LoggerService>;
  let mockRequest: MockProxy<Request>;
  let redirectRequest: MockProxy<Request>;
  let httpService: HttpService;
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
      'Content-Type': 'text/html; charset=utf-8',
    });
    mockPage.goto.calledWith('https://18f.gov').mockResolvedValue(mockResponse);
    mockPage.url.calledWith().mockReturnValue(finalUrl);
    mockBrowser.newPage.calledWith().mockResolvedValue(mockPage);

    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
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
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a CoreResult with the correct fields', async () => {
    const coreInputDto: CoreInputDto = {
      websiteId: 1,
      url: 'https://18f.gov',
    };

    const resp: AxiosResponse = {
      data: {},
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config: {},
    };

    jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(resp));

    const website = new Website();
    website.id = coreInputDto.websiteId;

    const result = await service.scan(coreInputDto);
    const expected = new CoreResult();
    expected.status = ScanStatus.Completed;
    expected.finalUrl = 'https://18f.gsa.gov';
    expected.finalUrlBaseDomain = 'gsa.gov';
    expected.finalUrlIsLive = true;
    expected.finalUrlMIMEType = 'text/html';
    expected.finalUrlSameDomain = false;
    expected.finalUrlSameWebsite = false;
    expected.finalUrlStatusCode = 200;
    expected.targetUrlBaseDomain = '18f.gov';
    expected.targetUrlRedirects = true;
    expected.website = website;
    expected.targetUrl404Test = true;

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
