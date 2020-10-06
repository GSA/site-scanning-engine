import { Test, TestingModule } from '@nestjs/testing';
import { CoreScanner } from '../scanners/core/core.scanner';
import { CoreInputDto } from '../../../dtos/scanners/core.input.dto';
import { CoreOutputDto } from '../../../dtos/scanners/core.output.dto';
import { mock, mockReset, MockProxy } from 'jest-mock-extended';
import { Scanner } from '../scanners/scanner.interface';
import { ScanEngineConsumer } from './scan-engine.consumer';
import { Job } from 'bull';

describe('ScanEngineController', () => {
  let consumer: ScanEngineConsumer;
  let module: TestingModule;
  let mockCoreScanner: MockProxy<Scanner<CoreInputDto, CoreOutputDto>>;
  let mockJob: MockProxy<Job<CoreInputDto>>;

  beforeEach(async () => {
    mockCoreScanner = mock<Scanner<CoreInputDto, CoreOutputDto>>();
    mockJob = mock<Job<CoreInputDto>>();
    module = await Test.createTestingModule({
      providers: [
        ScanEngineConsumer,
        {
          provide: CoreScanner,
          useValue: mockCoreScanner,
        },
      ],
    }).compile();

    consumer = module.get<ScanEngineConsumer>(ScanEngineConsumer);
  });

  afterEach(async () => {
    mockReset(mockCoreScanner);
    mockReset(mockJob);
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  it('should call the coreScanner when processCore is called', async () => {
    const input: CoreInputDto = {
      url: 'https://18f.gov',
      agency: 'GSA',
      branch: 'Executive',
    };

    mockJob.data = input;

    await consumer.processCore(mockJob);
    expect(mockCoreScanner.scan).toBeCalledWith(input);
  });
});
