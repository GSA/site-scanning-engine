import { Test, TestingModule } from '@nestjs/testing';
import { mock, mockReset, MockProxy } from 'jest-mock-extended';
import { ScanEngineConsumer } from './scan-engine.consumer';
import { Job } from 'bull';
import { CoreResultService } from '@app/database/core-results/core-result.service';
import { LoggerService } from '@app/logger';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { Scanner } from 'common/interfaces/scanner.interface';
import { CoreScannerService } from '@app/core-scanner';
import { CoreResult } from 'entities/core-result.entity';

describe('ScanEngineConsumer', () => {
  let consumer: ScanEngineConsumer;
  let module: TestingModule;
  let mockCoreScanner: MockProxy<Scanner<CoreInputDto, CoreResult>>;
  let mockCoreResultService: MockProxy<CoreResultService>;
  let mockJob: MockProxy<Job<CoreInputDto>>;
  let mockLogger: MockProxy<LoggerService>;

  beforeEach(async () => {
    mockCoreScanner = mock<Scanner<CoreInputDto, CoreResult>>();
    mockCoreResultService = mock<CoreResultService>();
    mockJob = mock<Job<CoreInputDto>>();
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
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    consumer = module.get<ScanEngineConsumer>(ScanEngineConsumer);
  });

  afterEach(async () => {
    mockReset(mockCoreScanner);
    mockReset(mockJob);
    mockReset(mockCoreResultService);
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  it('should call the CoreScanner and the CoreResultService', async () => {
    const input: CoreInputDto = {
      websiteId: 1,
      url: 'https://18f.gov',
    };

    mockJob.data = input;

    const coreResult = new CoreResult();
    coreResult.id = 1;

    mockCoreScanner.scan.calledWith(input).mockResolvedValue(coreResult);
    await consumer.processCore(mockJob);

    expect(mockCoreScanner.scan).toHaveBeenCalledWith(input);
    expect(mockCoreResultService.create).toHaveBeenCalledWith(coreResult);
  });
});
