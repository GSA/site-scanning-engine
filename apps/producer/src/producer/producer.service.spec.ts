import { CORE_SCAN_JOB_NAME, SCANNER_QUEUE_NAME } from '@app/message-queue';
import { getQueueToken } from '@nestjs/bull';
import { Test, TestingModule } from '@nestjs/testing';
import { Queue, Job } from 'bull';
import { CoreInputDto } from 'common/dtos/scanners/core.input.dto';
import { mock, MockProxy, mockReset } from 'jest-mock-extended';
import { ProducerService } from './producer.service';

describe('ProducerService', () => {
  let service: ProducerService;
  let mockQueue: MockProxy<Queue>;
  let mockJob: MockProxy<Job<CoreInputDto>>;

  beforeEach(async () => {
    mockQueue = mock<Queue>();
    mockJob = mock<Job<CoreInputDto>>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProducerService,
        {
          provide: getQueueToken(SCANNER_QUEUE_NAME),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<ProducerService>(ProducerService);
  });

  afterEach(async () => {
    mockReset(mockQueue);
    mockReset(mockJob);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add jobs to the Scanner queue', async () => {
    const data: CoreInputDto = {
      websiteId: 1,
      url: 'https://18f.gov',
    };
    mockJob.data = data;

    mockQueue.add
      .calledWith(CORE_SCAN_JOB_NAME, data)
      .mockResolvedValue(mockJob);

    const result = await service.addCoreJob(data);

    expect(result.data).toStrictEqual(mockJob.data);
  });
});
