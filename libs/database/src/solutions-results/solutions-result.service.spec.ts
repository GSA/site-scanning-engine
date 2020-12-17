import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';
import { SolutionsResultService } from './solutions-result.service';

describe('SolutionsResultService', () => {
  let service: SolutionsResultService;
  let mockRespository: MockProxy<Repository<SolutionsResult>>;

  beforeEach(async () => {
    mockRespository = mock<Repository<SolutionsResult>>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SolutionsResultService,
        {
          provide: getRepositoryToken(SolutionsResult),
          useValue: mockRespository,
        },
      ],
    }).compile();

    service = module.get<SolutionsResultService>(SolutionsResultService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all SolutionsResults', async () => {
    const solutionsResult = new SolutionsResult();
    solutionsResult.uswdsCount = 100;

    const expected = [solutionsResult];
    mockRespository.find.calledWith().mockResolvedValue(expected);
    const result = await service.findAll();
    expect(result).toStrictEqual(expected);
  });

  it('should return one SolutionsResult by id', async () => {
    const solutionsResult = new SolutionsResult();
    solutionsResult.id = 1;

    mockRespository.findOne.calledWith().mockResolvedValue(solutionsResult);
    const result = await service.findOne(1);

    expect(result).toStrictEqual(result);
  });

  it('should create a SolutionsResult', async () => {
    const website = new Website();
    website.id = 1;
    const solutionsResult = new SolutionsResult();
    solutionsResult.id = 1;
    solutionsResult.website = website;

    await service.create(solutionsResult);
    expect(mockRespository.insert).toHaveBeenCalledWith(solutionsResult);
  });
});
