import { Website } from '@app/database/websites/website.entity';
import { WebsiteService } from '@app/database/websites/websites.service';
import { LoggerService } from '@app/logger';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { mock, mockReset, MockProxy } from 'jest-mock-extended';
import { ProducerService } from '../producer/producer.service';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;
  let producerMock: MockProxy<ProducerService>;
  let websiteServiceMock: MockProxy<WebsiteService>;
  let loggerMock: MockProxy<LoggerService>;

  beforeEach(async () => {
    producerMock = mock<ProducerService>();
    websiteServiceMock = mock<WebsiteService>();
    loggerMock = mock<LoggerService>();
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
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
  });

  afterEach(async () => {
    mockReset(producerMock);
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
});
