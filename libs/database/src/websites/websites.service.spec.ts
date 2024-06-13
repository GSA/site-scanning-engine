import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Website } from 'entities/website.entity';
import { mock } from 'jest-mock-extended';
import { DeleteQueryBuilder, Repository, SelectQueryBuilder } from 'typeorm';
import { CreateWebsiteDto } from './dto/create-website.dto';
import { WebsiteService } from './websites.service';

describe('WebsiteService', () => {
  let service: WebsiteService;
  let mockRepository: any;
  let mockQB: any; // could not get this to typecheck as MockProxy<SelectQueryBuilder<Website>>

  beforeEach(async () => {
    mockRepository = mock<Repository<Website>>();
    mockQB = mock<SelectQueryBuilder<Website>>();
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all Websites needed for the snapshot', async () => {
    const website = new Website();
    website.url = 'https://18f.gov';
    website.topLevelDomain = 'gov';

    mockQB.innerJoinAndSelect.mockReturnThis();
    mockQB.where.mockReturnThis();
    mockQB.getMany.mockResolvedValue([website]);
    mockRepository.createQueryBuilder.mockReturnValue(mockQB);

    const result = await service.findAllSnapshotResults();

    const expected = [website];
    expect(result).toStrictEqual(expected);
  });

  it('should return one Website by id', async () => {
    const website = new Website();
    const lookup = 1;
    mockRepository.findOneBy.calledWith().mockResolvedValue(website);

    const result = await service.findOne(lookup);
    expect(result).toStrictEqual(website);
  });

  it('should return a Website by url', async () => {
    const website = new Website();
    mockRepository.find.mockResolvedValue(website);

    const result = await service.findByUrl('18f.gov');
    expect(result).toStrictEqual(website);
  });

  it('should insert a Website', async () => {
    const createWebsiteDto: CreateWebsiteDto = {
      website: 'https://18f.gov',
      topLevelDomain: 'gov',
      branch: 'Federal Agency - Executive',
      agency: 'General Services Administration',
      bureau: 'GSA,FAS,Technology Transformation Service',
      sourceList: 'gov',
      ombIdeaPublic: false,
    };

    const website = new Website();
    website.url = createWebsiteDto.website;
    website.topLevelDomain = createWebsiteDto.topLevelDomain;
    website.branch = createWebsiteDto.branch;
    website.agency = createWebsiteDto.agency;
    website.bureau = createWebsiteDto.bureau;
    website.sourceList = 'gov';
    (website.ombIdeaPublic = false), await service.upsert(createWebsiteDto);
    expect(mockRepository.insert).toHaveBeenCalledWith(website);
  });

  it('should get the most recently updated Website in the database', async () => {
    const website = new Website();
    website.url = 'https://18f.gov';
    website.updated = new Date().toISOString();
    mockRepository.find.calledWith().mockResolvedValue(website);

    const result = await service.findNewestWebsite();
    expect(result).toStrictEqual(website);
  });

  it('should delete Websites from the database that were last updated on or before a given datetime', async () => {
    const date = new Date();
    const website = new Website();
    website.url = 'https://18f.gov';
    website.updated = date.toISOString();

    const mockDeleteQB = mock<DeleteQueryBuilder<Website>>();
    mockDeleteQB.delete.mockReturnThis();
    mockDeleteQB.where.mockReturnThis();
    mockRepository.createQueryBuilder.mockReturnValue(mockDeleteQB);

    await service.deleteBefore(date);
    expect(mockRepository.delete.toHaveBeenCalled);
  });
});
