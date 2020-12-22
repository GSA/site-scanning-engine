import { WebsiteService } from '@app/database/websites/websites.service';
import { LoggerService } from '@app/logger';
import { StorageService } from '@app/storage';
import { Test, TestingModule } from '@nestjs/testing';
import { CoreResult } from 'entities/core-result.entity';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';
import { mock, MockProxy } from 'jest-mock-extended';
import { SnapshotService } from './snapshot.service';

describe('SnapshotService', () => {
  let service: SnapshotService;
  let module: TestingModule;
  let mockLogger: MockProxy<LoggerService>;
  let mockStorageService: MockProxy<StorageService>;
  let mockWebsiteService: MockProxy<WebsiteService>;

  beforeEach(async () => {
    mockLogger = mock<LoggerService>();
    mockStorageService = mock<StorageService>();
    mockWebsiteService = mock<WebsiteService>();
    module = await Test.createTestingModule({
      providers: [
        SnapshotService,
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
        {
          provide: WebsiteService,
          useValue: mockWebsiteService,
        },
      ],
    }).compile();

    service = module.get<SnapshotService>(SnapshotService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should serialize the database results to JSON and save in Storage', async () => {
    const website = new Website();
    const coreResult = new CoreResult();
    const solutionsResult = new SolutionsResult();

    coreResult.status = 'completed';
    solutionsResult.status = 'completed';

    website.solutionsResult = solutionsResult;
    website.coreResult = coreResult;
    website.url = '18f.gov';

    const fileName = 'weekly-snapshot.json';
    const body = JSON.stringify([website.serialized()]);

    mockWebsiteService.findAll.mockResolvedValue([website]);
    await service.weeklySnapshot();

    expect(mockStorageService.upload).toBeCalledWith(fileName, body);
    expect(mockStorageService.copy).toBeCalled();
  });
});
