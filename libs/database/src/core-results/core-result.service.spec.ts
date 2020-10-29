import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WebsiteController } from 'apps/api/src/website/website.controller';
import { mock, MockProxy, mockReset } from 'jest-mock-extended';
import { Repository } from 'typeorm';
import { Website } from '../websites/website.entity';
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
    coreResult.website = new Website();

    coreResult.finalUrl = 'https://18f.gsa.gov';

    const expected = [coreResult];
    mockRepository.find.calledWith().mockResolvedValue(expected);

    const result = await service.findAll();

    expect(result).toStrictEqual(expected);
  });

  it('should return one CoreResult by id', async () => {
    const coreResult = new CoreResult();
    coreResult.id = 1;

    mockRepository.findOne.calledWith().mockResolvedValue(coreResult);
    const result = await service.findOne(1);

    expect(result).toStrictEqual(coreResult);
  });

  it('should create a CoreResult', async () => {
    const coreResultDto: CreateCoreResultDto = {
      websiteId: 1,
      finalUrl: 'https://18f.gsa.gov',
      finalUrlIsLive: true,
      finalUrlBaseDomain: 'gsa.gov',
      targetUrlRedirects: true,
    };

    const coreResult = new CoreResult();
    const website = new Website();
    website.id = 1;
    coreResult.finalUrl = coreResultDto.finalUrl;
    coreResult.website = website;
    coreResult.finalUrlBaseDomain = coreResultDto.finalUrlBaseDomain;
    coreResult.finalUrlIsLive = coreResultDto.finalUrlIsLive;
    coreResult.targetUrlRedirects = coreResultDto.targetUrlRedirects;

    await service.create(coreResultDto);
    expect(mockRepository.save).toHaveBeenCalledWith(coreResult);
  });
});
