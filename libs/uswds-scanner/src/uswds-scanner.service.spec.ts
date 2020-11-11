import { BROWSER_TOKEN } from '@app/browser';
import { LoggerService } from '@app/logger';
import { Test, TestingModule } from '@nestjs/testing';
import { UswdsResult } from 'entities/uswds-result.entity';
import { Website } from 'entities/website.entity';
import { mock, MockProxy } from 'jest-mock-extended';
import { Browser, Page } from 'puppeteer';
import { UswdsScannerService } from './uswds-scanner.service';
import { UswdsInputDto } from './uswds.input.dto';

describe('UswdsScannerService', () => {
  let service: UswdsScannerService;
  let mockBrowser: MockProxy<Browser>;
  let mockPage: MockProxy<Page>;
  let mockLogger: MockProxy<LoggerService>;

  beforeEach(async () => {
    mockBrowser = mock<Browser>();
    mockPage = mock<Page>();
    mockBrowser.newPage.calledWith().mockResolvedValue(mockPage);
    mockLogger = mock<LoggerService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UswdsScannerService,
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

    service = module.get<UswdsScannerService>(UswdsScannerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return whether usa- is found in class selectors', async () => {
    const input: UswdsInputDto = {
      websiteId: 1,
      url: '18f.gov',
    };

    const website = new Website();
    website.id = input.websiteId;

    mockPage.evaluate.mockResolvedValue(4);

    const result = await service.scan(input);
    const expected = new UswdsResult();

    expected.website = website;
    expected.usaClassesDetected = 4;

    expect(result).toStrictEqual(expected);
  });
});
