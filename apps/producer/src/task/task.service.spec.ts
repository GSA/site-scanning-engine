import { WebsiteService } from '@app/database/websites/websites.service';
import { LoggerService } from '@app/logger';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { mock, mockReset, MockProxy } from 'jest-mock-extended';
import { ProducerService } from '../producer/producer.service';
import { TaskService } from './task.service';
import { Website } from 'entities/website.entity';
import { SnapshotService } from '@app/snapshot';

describe('TaskService', () => {
  let service: TaskService;
  let producerMock: MockProxy<ProducerService>;
  let websiteServiceMock: MockProxy<WebsiteService>;
  let loggerMock: MockProxy<LoggerService>;
  let snapshotMock: MockProxy<SnapshotService>;

  beforeEach(async () => {
    producerMock = mock<ProducerService>();
    websiteServiceMock = mock<WebsiteService>();
    loggerMock = mock<LoggerService>();
    snapshotMock = mock<SnapshotService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: ProducerService,
          useValue: producerMock,
        },
        {
          provide: WebsiteService,
          useValue: websiteServiceMock,
        },
        {
          provide: LoggerService,
          useValue: loggerMock,
        },
        {
          provide: ConfigService,
          useValue: {},
        },
        {
          provide: SchedulerRegistry,
          useValue: {},
        },
        {
          provide: SnapshotService,
          useValue: snapshotMock,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create jobs on the core queue', async () => {
    const website = new Website();
    website.id = 1;
    website.url = 'https://18f.gov';
    websiteServiceMock.findAll
      .calledWith()
      .mockResolvedValue(Promise.resolve([website]));
    const expected: CoreInputDto = {
      websiteId: website.id,
      url: website.url,
    };
    await service.coreScanProducer();
    expect(producerMock.addCoreJob).toBeCalledWith(expected);
  });

  it('should create snapshot jobs', async () => {
    await service.snapshot();
    expect(snapshotMock.weeklySnapshot).toHaveBeenCalled();
  });
});
