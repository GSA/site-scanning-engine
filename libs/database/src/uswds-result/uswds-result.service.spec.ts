import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UswdsResult } from 'entities/uswds-result.entity';
import { Website } from 'entities/website.entity';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';
import { UswdsResultService } from './uswds-result.service';

describe('UswdsResultService', () => {
  let service: UswdsResultService;
  let mockRespository: MockProxy<Repository<UswdsResult>>;

  beforeEach(async () => {
    mockRespository = mock<Repository<UswdsResult>>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UswdsResultService,
        {
          provide: getRepositoryToken(UswdsResult),
          useValue: mockRespository,
        },
      ],
    }).compile();

    service = module.get<UswdsResultService>(UswdsResultService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all UswdsResults', async () => {
    const uswdsResult = new UswdsResult();
    uswdsResult.uswdsCount = 100;

    const expected = [uswdsResult];
    mockRespository.find.calledWith().mockResolvedValue(expected);
    const result = await service.findAll();
    expect(result).toStrictEqual(expected);
  });

  it('should return one UswdsResult by id', async () => {
    const uswdsResult = new UswdsResult();
    uswdsResult.id = 1;

    mockRespository.findOne.calledWith().mockResolvedValue(uswdsResult);
    const result = await service.findOne(1);

    expect(result).toStrictEqual(result);
  });

  it('should create a UswdsResult', async () => {
    const website = new Website();
    website.id = 1;
    const uswdsResult = new UswdsResult();
    uswdsResult.id = 1;
    uswdsResult.website = website;

    await service.create(uswdsResult);
    expect(mockRespository.save).toHaveBeenCalledWith(uswdsResult);
  });
});
