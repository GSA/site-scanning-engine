import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { lookup } from 'dns';
import { mock, MockProxy, mockReset } from 'jest-mock-extended';
import { Repository } from 'typeorm';
import { CreateWebsiteDto } from './dto/create-website.dto';
import { Website } from './website.entity';
import { WebsiteService } from './websites.service';

describe('WebsiteService', () => {
  let service: WebsiteService;
  let mockRepository: MockProxy<Repository<Website>>;

  beforeEach(async () => {
    mockRepository = mock<Repository<Website>>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebsiteService,
        {
          provide: getRepositoryToken(Website),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WebsiteService>(WebsiteService);
  });

  afterEach(async () => {
    mockReset(mockRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all Websites', async () => {
    const website = new Website();
    website.url = 'https://18f.gov';

    const expected = [website];
    mockRepository.find.calledWith().mockResolvedValue(expected);
    const result = await service.findAll();

    expect(result).toStrictEqual(expected);
  });

  it('should return one Website by id', async () => {
    const website = new Website();
    const lookup = 1;
    mockRepository.findOne.calledWith().mockResolvedValue(website);

    const result = await service.findOne(lookup);
    expect(result).toStrictEqual(website);
  });

  it('should create a Website', async () => {
    const createWebsiteDto: CreateWebsiteDto = {
      url: 'https://18f.gov',
      agency: 'GSA',
      branch: 'Executive',
    };

    const website = new Website();
    website.url = createWebsiteDto.url;
    website.agency = createWebsiteDto.agency;
    website.branch = createWebsiteDto.branch;

    await service.create(createWebsiteDto);
    expect(mockRepository.save).toHaveBeenCalledWith(website);
  });
});
