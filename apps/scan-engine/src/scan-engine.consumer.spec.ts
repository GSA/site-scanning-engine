import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';
import { ScanEngineConsumer } from './scan-engine.consumer';
import { Job } from 'bull';
import { CoreResultService } from '@app/database/core-results/core-result.service';
import { LoggerService } from '@app/logger';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { Scanner } from 'common/interfaces/scanner.interface';
import { CoreScannerService } from '@app/core-scanner';
import { CoreResult } from 'entities/core-result.entity';
import { UswdsResultService } from '@app/database/uswds-result/uswds-result.service';
import { UswdsInputDto } from '@app/uswds-scanner/uswds.input.dto';
import { UswdsResult } from 'entities/uswds-result.entity';
import { UswdsScannerService } from '@app/uswds-scanner';

describe('ScanEngineConsumer', () => {
  let consumer: ScanEngineConsumer;
  let module: TestingModule;
  let mockCoreScanner: MockProxy<Scanner<CoreInputDto, CoreResult>>;
  let mockCoreResultService: MockProxy<CoreResultService>;
  let mockUswdsScanner: MockProxy<Scanner<UswdsInputDto, UswdsResult>>;
  let mockUswdsResultService: MockProxy<UswdsResultService>;
  let mockCoreJob: MockProxy<Job<CoreInputDto>>;
  let mockUswdsJob: MockProxy<Job<UswdsInputDto>>;
  let mockLogger: MockProxy<LoggerService>;

  beforeEach(async () => {
    mockCoreScanner = mock<Scanner<CoreInputDto, CoreResult>>();
    mockCoreResultService = mock<CoreResultService>();
    mockUswdsScanner = mock<Scanner<UswdsInputDto, UswdsResult>>();
    mockUswdsResultService = mock<UswdsResultService>();
    mockCoreJob = mock<Job<CoreInputDto>>();
    mockUswdsJob = mock<Job<UswdsInputDto>>();
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
          provide: UswdsScannerService,
          useValue: mockUswdsScanner,
        },
        {
          provide: UswdsResultService,
          useValue: mockUswdsResultService,
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
    };

    mockCoreJob.data = input;

    const coreResult = new CoreResult();
    coreResult.id = 1;

    mockCoreScanner.scan.calledWith(input).mockResolvedValue(coreResult);
    await consumer.processCore(mockCoreJob);

    expect(mockCoreScanner.scan).toHaveBeenCalledWith(input);
    expect(mockCoreResultService.create).toHaveBeenCalledWith(coreResult);
  });

  it('should call the UswdsScanner and UswdsResultService', async () => {
    const input: UswdsInputDto = {
      websiteId: 1,
      url: 'https://18f.gov',
    };

    mockUswdsJob.data = input;

    const uswdsResult = new UswdsResult();
    uswdsResult.id = 1;

    mockUswdsScanner.scan.calledWith(input).mockResolvedValue(uswdsResult);
    await consumer.processUswds(mockUswdsJob);

    expect(mockUswdsScanner.scan).toHaveBeenCalledWith(input);
    expect(mockUswdsResultService.create).toHaveBeenLastCalledWith(uswdsResult);
  });
});
