import { WebsiteService } from '@app/database/websites/websites.service';
import { HttpService } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';
import { IngestService } from './ingest.service';
import { ConfigService } from '@nestjs/config';

describe('IngestService', () => {
  let service: IngestService;
  let mockHttpService: MockProxy<HttpService>;
  let mockWebsiteService: MockProxy<WebsiteService>;
  let mockConfigService: MockProxy<ConfigService>;
  beforeEach(async () => {
    mockHttpService = mock<HttpService>();
    mockWebsiteService = mock<WebsiteService>();
    mockConfigService = mock<ConfigService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestService,
        {
          provide: WebsiteService,
          useValue: mockWebsiteService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<IngestService>(IngestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
