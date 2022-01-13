import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';
import { Job } from 'bull';

import { CoreScannerService } from '@app/core-scanner';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { CoreResultService } from '@app/database/core-results/core-result.service';
import { SolutionsResultService } from '@app/database/solutions-results/solutions-result.service';
import { SolutionsInputDto } from '@app/solutions-scanner/solutions.input.dto';

import { CoreResult } from 'entities/core-result.entity';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { Scanner } from 'libs/scanner.interface';
import { SolutionsScannerService } from 'libs/solutions-scanner/src';

import { ScanEngineConsumer } from './scan-engine.consumer';
import { QueueService } from '@app/queue';

describe('ScanEngineConsumer', () => {
  let consumer: ScanEngineConsumer;
  let module: TestingModule;
  let mockCoreScanner: MockProxy<Scanner<CoreInputDto, CoreResult>>;
  let mockCoreResultService: MockProxy<CoreResultService>;
  let mockSolutionsScanner: MockProxy<
    Scanner<SolutionsInputDto, SolutionsResult>
  >;
  let mockSolutionsResultService: MockProxy<SolutionsResultService>;
  let mockCoreJob: MockProxy<Job<CoreInputDto>>;
  let mockQueueService: MockProxy<QueueService>;

  beforeEach(async () => {
    mockCoreScanner = mock<Scanner<CoreInputDto, CoreResult>>();
    mockCoreResultService = mock<CoreResultService>();
    mockSolutionsScanner = mock<Scanner<SolutionsInputDto, SolutionsResult>>();
    mockSolutionsResultService = mock<SolutionsResultService>();
    mockCoreJob = mock<Job<CoreInputDto>>();
    mockQueueService = mock<QueueService>();
    module = await Test.createTestingModule({
      providers: [
        ScanEngineConsumer,
        {
          provide: CoreScannerService,
          useValue: mockCoreScanner,
        },
        {
          provide: CoreResultService,
          useValue: mockCoreResultService,
        },
        {
          provide: SolutionsScannerService,
          useValue: mockSolutionsScanner,
        },
        {
          provide: SolutionsResultService,
          useValue: mockSolutionsResultService,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    consumer = module.get<ScanEngineConsumer>(ScanEngineConsumer);
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  it('should call the CoreScanner and the CoreResultService', async () => {
    const input: CoreInputDto = {
      websiteId: 1,
      url: 'https://18f.gov',
      scanId: '123',
    };

    mockCoreJob.data = input;

    const coreResult = new CoreResult();
    coreResult.id = 1;

    mockCoreScanner.scan.calledWith(input).mockResolvedValue(coreResult);
    await consumer.processCore(mockCoreJob);

    expect(mockCoreScanner.scan).toHaveBeenCalledWith(input);
    expect(mockCoreResultService.create).toHaveBeenCalledWith(coreResult);
  });
});
