import { Test, TestingModule } from '@nestjs/testing';
import { mock, mockReset, MockProxy } from 'jest-mock-extended';
import { ProducerService } from '../producer.service';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;
  let producerMock: MockProxy<ProducerService>;

  beforeEach(async () => {
    producerMock = mock<ProducerService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: ProducerService,
          useValue: producerMock,
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

  it('should create jobs on the core queue', () => {
    const expected = {
      url: 'https://18f.gov',
      agency: 'GSA',
      branch: 'Executive',
    };
    service.coreScanProducer();
    expect(producerMock.addCoreJob).toBeCalledWith(expected);
  });
});
