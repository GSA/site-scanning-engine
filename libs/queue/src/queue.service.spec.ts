import { CORE_SCAN_JOB_NAME, SCANNER_QUEUE_NAME } from '@app/message-queue';
import { getQueueToken } from '@nestjs/bull';
import { Test, TestingModule } from '@nestjs/testing';
import { Queue, Job } from 'bull';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { mock, MockProxy, mockReset } from 'jest-mock-extended';
import { QueueService } from './queue.service';

describe('QueueService', () => {
  let service: QueueService;
  let mockQueue: MockProxy<Queue>;
  let mockJob: MockProxy<Job<CoreInputDto>>;

  beforeEach(async () => {
    mockQueue = mock<Queue>();
    mockJob = mock<Job<CoreInputDto>>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: getQueueToken(SCANNER_QUEUE_NAME),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
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
      filter: false,
      pageviews: 1,
      visits: 1,
      scanId: '123',
    };
    mockJob.data = data;

    mockQueue.add
      .calledWith(CORE_SCAN_JOB_NAME, data)
      .mockResolvedValue(mockJob);

    const result = await service.addCoreJob(data);

    expect(result.data).toStrictEqual(mockJob.data);
  });

  it('should empty and clean the Scanner queue', async () => {
    await service.emptyAndClean();

    expect(mockQueue.empty).toHaveBeenCalled();
    expect(mockQueue.clean).toHaveBeenCalled();
  });

  it('should get the Scanner queue status', async () => {
    mockQueue.getActiveCount.mockResolvedValue(1);
    mockQueue.count.mockResolvedValue(2);

    const result = await service.getQueueStatus();

    expect(result).toStrictEqual({
      activeCount: 1,
      count: 2,
    });
  });
});
