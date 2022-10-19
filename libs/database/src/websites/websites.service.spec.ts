import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Website } from 'entities/website.entity';
import { mock } from 'jest-mock-extended';
import { DeleteQueryBuilder, Repository, SelectQueryBuilder } from 'typeorm';
import { CreateWebsiteDto } from './dto/create-website.dto';
import { WebsiteService } from './websites.service';
import { CoreResult } from 'entities/core-result.entity';

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

  it('should return all Websites', async () => {
    const website = new Website();
    website.url = 'https://18f.gov';

    mockQB.innerJoinAndSelect.mockReturnThis();
    mockQB.getMany.mockResolvedValue([website]);
    mockRepository.createQueryBuilder.mockReturnValue(mockQB);

    const result = await service.findAllWebsiteResults();

    const expected = [website];
    expect(result).toStrictEqual(expected);
  });

  it('should return one Website by id', async () => {
    const website = new Website();
    const lookup = 1;
    mockRepository.findOne.calledWith().mockResolvedValue(website);

    const result = await service.findOne(lookup);
    expect(result).toStrictEqual(website);
  });

  it('should return a Website by url', async () => {
    const website = new Website();
    mockRepository.findOne.mockResolvedValue(website);

    const result = await service.findByUrl('18f.gov');
    expect(result).toStrictEqual(website);
  });

  it('should insert a Website', async () => {
    const createWebsiteDto: CreateWebsiteDto = {
      website: 'https://18f.gov',
      branch: 'Federal Agency - Executive',
      agency: 'General Services Administration',
      bureau: 'GSA,FAS,Technology Transformation Service',
      agencyCode: 10,
      bureauCode: 10,
      sourceListFederalDomains: true,
      sourceListDap: false,
      sourceListPulse: false,
    };

    const website = new Website();
    website.url = createWebsiteDto.website;
    website.branch = createWebsiteDto.branch;
    website.agency = createWebsiteDto.agency;
    website.bureau = createWebsiteDto.bureau;
    website.agencyCode = 10;
    website.bureauCode = 10;
    website.sourceListFederalDomains = true;
    website.sourceListDap = false;
    website.sourceListPulse = false;

    await service.upsert(createWebsiteDto);
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
