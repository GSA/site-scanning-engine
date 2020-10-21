import { Test, TestingModule } from '@nestjs/testing';
import { CoreScanner } from '../scanners/core/core.scanner';
import { CoreInputDto } from '../../../../dtos/scanners/core.input.dto';
import { CoreOutputDto } from '../../../../dtos/scanners/core.output.dto';
import { mock, mockReset, MockProxy } from 'jest-mock-extended';
import { Scanner } from '../scanners/scanner.interface';
import { ScanEngineConsumer } from './scan-engine.consumer';
import { Job } from 'bull';
import { CoreResultService } from '@app/database/core-results/core-result.service';
import { CreateCoreResultDto } from '@app/database/core-results/dto/create-core-result.dto';
import { LoggerService } from '@app/logger';

describe('ScanEngineController', () => {
  let consumer: ScanEngineConsumer;
  let module: TestingModule;
  let mockCoreScanner: MockProxy<Scanner<CoreInputDto, CoreOutputDto>>;
  let mockCoreResultService: MockProxy<CoreResultService>;
  let mockJob: MockProxy<Job<CoreInputDto>>;
  let mockLogger: MockProxy<LoggerService>;

  beforeEach(async () => {
    mockCoreScanner = mock<Scanner<CoreInputDto, CoreOutputDto>>();
    mockCoreResultService = mock<CoreResultService>();
    mockJob = mock<Job<CoreInputDto>>();
    mockLogger = mock<LoggerService>();
    module = await Test.createTestingModule({
      providers: [
        ScanEngineConsumer,
        {
          provide: CoreScanner,
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

    const coreOutputDto: CoreOutputDto = {
      websiteId: input.websiteId,
      finalUrl: 'https://18f.gsa.gov',
    };

    const createCoreResultDto: CreateCoreResultDto = {
      websiteId: coreOutputDto.websiteId,
      finalUrl: coreOutputDto.finalUrl,
    };

    mockJob.data = input;

    mockCoreScanner.scan.calledWith(input).mockResolvedValue(coreOutputDto);
    await consumer.processCore(mockJob);

    expect(mockCoreScanner.scan).toHaveBeenCalledWith(input);
    expect(mockCoreResultService.create).toHaveBeenCalledWith(
      createCoreResultDto,
    );
  });
});
