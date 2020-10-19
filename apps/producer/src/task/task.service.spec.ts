import { Website } from '@app/database/websites/website.entity';
import { WebsiteService } from '@app/database/websites/websites.service';
import { Test, TestingModule } from '@nestjs/testing';
import { mock, mockReset, MockProxy } from 'jest-mock-extended';
import { ProducerService } from '../producer/producer.service';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;
  let producerMock: MockProxy<ProducerService>;
  let websiteServiceMock: MockProxy<WebsiteService>;

  beforeEach(async () => {
    producerMock = mock<ProducerService>();
    websiteServiceMock = mock<WebsiteService>();
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
    website.agency = 'GSA';
    website.branch = 'Executive';
    websiteServiceMock.findAll
      .calledWith()
      .mockResolvedValue(Promise.resolve([website]));
    const expected = {
      url: 'https://18f.gov',
      agency: 'GSA',
      branch: 'Executive',
    };
    await service.coreScanProducer();
    expect(producerMock.addCoreJob).toBeCalledWith(expected);
  });
});
