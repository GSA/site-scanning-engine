import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Website } from 'entities/website.entity';
import { mock, mockReset } from 'jest-mock-extended';
import {
  Repository,
  SelectQueryBuilder,
  createConnection,
  getConnection,
} from 'typeorm';
import { AnalysisDto } from './analysis.dto';
import { AnalysisService } from './analysis.service';
import { FilterWebsiteDto } from 'apps/api/src/website/filter-website.dto';

describe('AnalysisService', () => {
  let service: AnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisService,
        {
          provide: getRepositoryToken(Website),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AnalysisService>(AnalysisService);

    return createConnection({
      type: 'sqlite',
      database: ':memory:',
      dropSchema: true,
      entities: [Website],
      synchronize: true,
      logging: false,
    });
  });

  afterEach(async () => {
    const conn = getConnection();
    return conn.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should analysis data for a website', async () => {
    const website = new Website();
    website.url = 'https://18f.gov';
    website.branch = 'Federal Agency - Executive';
    website.agency = 'General Services Administration';
    website.bureau = 'GSA,FAS,Technology Transformation Service';
    website.agencyCode = 10;
    website.bureauCode = 10;
    website.sourceListFederalDomains = true;
    website.sourceListDap = false;
    website.sourceListPulse = false;

    mockQB.innerJoinAndSelect.mockReturnThis();
    mockQB.getMany.mockResolvedValue([website]);
    mockRepository.createQueryBuilder.mockReturnValue(mockQB);

    const filterDto: FilterWebsiteDto = {
      target_url_domain: null,
      final_url_domain: null,
      final_url_live: null,
      target_url_redirects: null,
      target_url_agency_owner: null,
      target_url_bureau_owner: null,
      scan_status: null,
      dap_detected_final_url: null,
    };

    const result: AnalysisDto = await service.getWebsiteAnalysis(filterDto);

    expect(result).toStrictEqual({ total: 1 });
  });

  it('should analysis data for websites', async () => {
    const firstWebsite = new Website();
    firstWebsite.url = 'https://18f.gov';
    firstWebsite.branch = 'Federal Agency - Executive';
    firstWebsite.agency = 'General Services Administration';
    firstWebsite.bureau = 'GSA,FAS,Technology Transformation Service';
    firstWebsite.agencyCode = 10;
    firstWebsite.bureauCode = 10;
    firstWebsite.sourceListFederalDomains = true;
    firstWebsite.sourceListDap = false;
    firstWebsite.sourceListPulse = false;

    const secondWebsite = new Website();
    secondWebsite.url = 'https://fake.gov';
    secondWebsite.branch = 'Federal Agency - Executive';
    secondWebsite.agency = 'Fake Agency';
    secondWebsite.bureau = 'GSA,FAS,Technology Transformation Service';
    secondWebsite.agencyCode = 10;
    secondWebsite.bureauCode = 10;
    secondWebsite.sourceListFederalDomains = true;
    secondWebsite.sourceListDap = false;
    secondWebsite.sourceListPulse = false;

    mockQB.innerJoinAndSelect.mockReturnThis();
    mockQB.getMany.mockResolvedValue([firstWebsite, secondWebsite]);
    mockRepository.createQueryBuilder.mockReturnValue(mockQB);

    const filterDto: FilterWebsiteDto = {
      target_url_domain: null,
      final_url_domain: null,
      final_url_live: null,
      target_url_redirects: null,
      target_url_agency_owner: 'Fake Agency',
      target_url_bureau_owner: null,
      scan_status: null,
      dap_detected_final_url: null,
    };

    const result: AnalysisDto = await service.getWebsiteAnalysis(filterDto);

    expect(result).toStrictEqual({ total: 1 });
  });
});
