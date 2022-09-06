import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { Connection, createConnection, Repository } from 'typeorm';
import { AnalysisDto } from './analysis.dto';
import { AnalysisService } from './analysis.service';
import { FilterWebsiteDto } from 'apps/api/src/website/filter-website.dto';

describe('AnalysisService', () => {
  let db: Connection;
  let websiteRepository: Repository<Website>;
  let coreResultRepository: Repository<CoreResult>;
  let service: AnalysisService;

  beforeEach(async () => {
    db = await createConnection({
      type: 'sqlite',
      database: ':memory:',
      entities: [CoreResult, Website],
      dropSchema: true,
      synchronize: true,
      logging: false,
    });

    websiteRepository = await db.getRepository(Website);
    coreResultRepository = await db.getRepository(CoreResult);
    service = new AnalysisService(websiteRepository);
  });

  afterEach(() => db.close());

  it('repository should be defined', () => {
    expect(websiteRepository).toBeDefined();
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get analysis data for a website', async () => {
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

    const coreResult = createCoreResult(website);
    coreResult.finalUrlBaseDomain = '18f.gov';

    await websiteRepository.insert(website);
    await coreResultRepository.insert(coreResult);

    const filterDto: FilterWebsiteDto = {
      target_url_domain: null,
      final_url_domain: null,
      target_url_agency_owner: null,
      target_url_bureau_owner: null,
      scan_status: null,
    };

    const result: AnalysisDto = await service.getWebsiteAnalysis(filterDto);
    const expectedResult = {
      total: 1,
      totalFinalUrlBaseDomains: 1,
      totalAgencies: 1,
    };

    expect(result).toStrictEqual(expectedResult);
  });

  it('should filter by agency', async () => {
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

    const firstCoreResult = createCoreResult(firstWebsite);
    firstCoreResult.finalUrlBaseDomain = '18f.gov';
    const secondCoreResult = createCoreResult(secondWebsite);
    secondCoreResult.finalUrlBaseDomain = 'fake.gov';

    await websiteRepository.insert(firstWebsite);
    await coreResultRepository.insert(firstCoreResult);
    await websiteRepository.insert(secondWebsite);
    await coreResultRepository.insert(secondCoreResult);

    const filterDto: FilterWebsiteDto = {
      target_url_domain: null,
      final_url_domain: null,
      target_url_agency_owner: 'Fake Agency',
      target_url_bureau_owner: null,
      scan_status: null,
    };

    const result: AnalysisDto = await service.getWebsiteAnalysis(filterDto);
    const expectedResult = {
      total: 1,
      totalFinalUrlBaseDomains: 1,
      totalAgencies: 1,
    };

    expect(result).toStrictEqual(expectedResult);
  });

  it('count domains', async () => {
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

    const firstCoreResult = createCoreResult(firstWebsite);
    firstCoreResult.finalUrlBaseDomain = '18f.gov';
    const secondCoreResult = createCoreResult(secondWebsite);
    secondCoreResult.finalUrlBaseDomain = 'fake.gov';

    await websiteRepository.insert(firstWebsite);
    await coreResultRepository.insert(firstCoreResult);
    await websiteRepository.insert(secondWebsite);
    await coreResultRepository.insert(secondCoreResult);

    const filterDto: FilterWebsiteDto = {
      target_url_domain: null,
      final_url_domain: null,
      target_url_agency_owner: null,
      target_url_bureau_owner: null,
      scan_status: null,
    };

    const result: AnalysisDto = await service.getWebsiteAnalysis(filterDto);
    const expectedResult = {
      total: 2,
      totalFinalUrlBaseDomains: 2,
      totalAgencies: 2,
    };

    expect(result).toStrictEqual(expectedResult);
  });

  it('count agencies', async () => {
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
    secondWebsite.agency = 'General Services Administration';
    secondWebsite.bureau = 'GSA,FAS,Technology Transformation Service';
    secondWebsite.agencyCode = 10;
    secondWebsite.bureauCode = 10;
    secondWebsite.sourceListFederalDomains = true;
    secondWebsite.sourceListDap = false;
    secondWebsite.sourceListPulse = false;

    const firstCoreResult = createCoreResult(firstWebsite);
    firstCoreResult.finalUrlBaseDomain = '18f.gov';
    const secondCoreResult = createCoreResult(secondWebsite);
    secondCoreResult.finalUrlBaseDomain = 'fake.gov';

    await websiteRepository.insert(firstWebsite);
    await coreResultRepository.insert(firstCoreResult);
    await websiteRepository.insert(secondWebsite);
    await coreResultRepository.insert(secondCoreResult);

    const filterDto: FilterWebsiteDto = {
      target_url_domain: null,
      final_url_domain: null,
      target_url_agency_owner: null,
      target_url_bureau_owner: null,
      scan_status: null,
    };

    const result: AnalysisDto = await service.getWebsiteAnalysis(filterDto);
    const expectedResult = {
      total: 2,
      totalFinalUrlBaseDomains: 2,
      totalAgencies: 1,
    };

    expect(result).toStrictEqual(expectedResult);
  });
});

function createCoreResult(website: Website) {
  const coreResult = new CoreResult();
  coreResult.website = website;
  coreResult.notFoundScanStatus = 'complete';
  coreResult.primaryScanStatus = 'complete';
  coreResult.robotsTxtScanStatus = 'complete';
  coreResult.sitemapXmlScanStatus = 'complete';
  coreResult.targetUrlBaseDomain = 'complete';
  return coreResult;
}
