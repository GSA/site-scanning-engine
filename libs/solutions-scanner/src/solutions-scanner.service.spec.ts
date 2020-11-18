import { BROWSER_TOKEN } from '@app/browser';
import { ScanStatus } from '@app/core-scanner/scan-status';
import { LoggerService } from '@app/logger';
import { Test, TestingModule } from '@nestjs/testing';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';
import { mock, MockProxy } from 'jest-mock-extended';
import { Browser, Page, Response } from 'puppeteer';
import { SolutionsScannerService } from './solutions-scanner.service';
import { SolutionsInputDto } from './solutions.input.dto';

describe('SolutionsScannerService', () => {
  let service: SolutionsScannerService;
  let mockBrowser: MockProxy<Browser>;
  let mockPage: MockProxy<Page>;
  let mockLogger: MockProxy<LoggerService>;
  let mockResponse: MockProxy<Response>;

  beforeEach(async () => {
    mockBrowser = mock<Browser>();
    mockPage = mock<Page>();
    mockResponse = mock<Response>();
    mockBrowser.newPage.calledWith().mockResolvedValue(mockPage);
    mockLogger = mock<LoggerService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SolutionsScannerService,
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

    service = module.get<SolutionsScannerService>(SolutionsScannerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the correct response', async () => {
    const input: SolutionsInputDto = {
      websiteId: 1,
      url: '18f.gov',
    };

    const website = new Website();
    website.id = input.websiteId;

    mockPage.evaluate.mockResolvedValue(4);
    mockResponse.text.mockResolvedValue(
      'uswds uswds <table> .usa- us_flag_small.png',
    );
    mockPage.goto.mockResolvedValue(mockResponse);

    const result = await service.scan(input);
    const expected = new SolutionsResult();

    expected.website = website;
    expected.usaClasses = 4;
    expected.uswdsString = 2;
    expected.uswdsTables = -10;
    expected.uswdsInlineCss = 1;
    expected.uswdsUsFlag = 20;
    expected.uswdsStringInCss = 0; // :TODO mock this
    expected.uswdsUsFlagInCss = 0; // :TODO mock this
    expected.uswdsMerriweatherFont = 0; // :TODO mock this
    expected.uswdsPublicSansFont = 0; // :TODO mock this
    expected.uswdsSourceSansFont = 0; // :TODO mock this
    expected.uswdsCount = 17;
    expected.uswdsSemanticVersion = undefined;
    expected.uswdsVersion = 0;
    expected.dapDetected = false;
    expected.dapParameters = undefined;
    expected.status = ScanStatus.Completed;

    expect(result).toStrictEqual(expected);
  });
});
