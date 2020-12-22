import { LoggerService } from '@app/logger';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let mockLogger: MockProxy<LoggerService>;

  beforeEach(async () => {
    mockLogger = mock<LoggerService>();
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        StorageService,
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
