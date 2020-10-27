import { WebsiteService } from '@app/database/websites/websites.service';
import { LoggerService } from '@app/logger';
import { HttpService } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';
import { IngestService } from './ingest.service';

describe('IngestService', () => {
  let service: IngestService;
  let mockHttpService: MockProxy<HttpService>;
  let mockWebsiteService: MockProxy<WebsiteService>;
  let mockLogger: MockProxy<LoggerService>;

  beforeEach(async () => {
    mockHttpService = mock<HttpService>();
    mockWebsiteService = mock<WebsiteService>();
    mockLogger = mock<LoggerService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestService,
        {
          provide: WebsiteService,
          useValue: mockWebsiteService,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<IngestService>(IngestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
