import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';
import { ScanEngineConsumer } from './scan-engine.consumer';
import { Job } from 'bull';
import { CoreResultService } from '@app/database/core-results/core-result.service';
import { LoggerService } from '@app/logger';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { Scanner } from 'libs/scanner.interface';
import { CoreScannerService } from '@app/core-scanner';
import { CoreResult } from 'entities/core-result.entity';
import { SolutionsResultService } from '@app/database/solutions-results/solutions-result.service';
import { SolutionsInputDto } from 'libs/solutions-scanner/src/solutions.input.dto';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { SolutionsScannerService } from 'libs/solutions-scanner/src';

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
  let mockSolutionsJob: MockProxy<Job<SolutionsInputDto>>;
  let mockLogger: MockProxy<LoggerService>;

  beforeEach(async () => {
    mockCoreScanner = mock<Scanner<CoreInputDto, CoreResult>>();
    mockCoreResultService = mock<CoreResultService>();
    mockSolutionsScanner = mock<Scanner<SolutionsInputDto, SolutionsResult>>();
    mockSolutionsResultService = mock<SolutionsResultService>();
    mockCoreJob = mock<Job<CoreInputDto>>();
    mockSolutionsJob = mock<Job<SolutionsInputDto>>();
    mockLogger = mock<LoggerService>();
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
          provide: LoggerService,
          useValue: mockLogger,
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
