import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy, mockReset } from 'jest-mock-extended';
import { Repository } from 'typeorm';
import { CoreResult } from './core-result.entity';
import { CoreResultService } from './core-result.service';
import { CreateCoreResultDto } from './dto/create-core-result.dto';

describe('CoreResultService', () => {
  let service: CoreResultService;
  let mockRepository: MockProxy<Repository<CoreResult>>;

  beforeEach(async () => {
    mockRepository = mock<Repository<CoreResult>>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoreResultService,
        {
          provide: getRepositoryToken(CoreResult),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CoreResultService>(CoreResultService);
  });

  afterEach(async () => {
    mockReset(mockRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all CoreResults', async () => {
    const coreResult = new CoreResult();
    coreResult.targetUrl = 'https://18f.gov';
    coreResult.finalUrl = 'https://18f.gsa.gov';
    coreResult.agency = 'GSA';
    coreResult.branch = 'Executive';

    const expected = [coreResult];
    mockRepository.find.calledWith().mockResolvedValue(expected);

    const result = await service.findAll();

    expect(result).toStrictEqual(expected);
  });

  it('should return one CoreResult by id', async () => {
    const coreResult = new CoreResult();
    coreResult.targetUrl = 'https://18f.gov';
    coreResult.finalUrl = 'https://18f.gsa.gov';
    coreResult.agency = 'GSA';
    coreResult.branch = 'Executive';
    const lookup = 1;

    mockRepository.findOne.calledWith().mockResolvedValue(coreResult);
    const result = await service.findOne(lookup);

    expect(result).toStrictEqual(coreResult);
  });

  it('should create a CoreResult', async () => {
    const coreResultDto: CreateCoreResultDto = {
      targetUrl: 'https://18f.gov',
      finalUrl: 'https://18f.gsa.gov',
      agency: 'GSA',
      branch: 'Executive',
    };

    const coreResult = new CoreResult();
    coreResult.targetUrl = 'https://18f.gov';
    coreResult.finalUrl = 'https://18f.gsa.gov';
    coreResult.agency = 'GSA';
    coreResult.branch = 'Executive';

    await service.create(coreResultDto);
    expect(mockRepository.save).toHaveBeenCalledWith(coreResult);
  });
});
