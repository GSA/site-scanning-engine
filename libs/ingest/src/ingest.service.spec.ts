import { WebsiteService } from '@app/database/websites/websites.service';
import { UrlList } from './url-list';
import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';
import { IngestService } from './ingest.service';
import { Website } from 'entities/website.entity';

describe('IngestService', () => {
  let service: IngestService;
  let mockWebsiteService: MockProxy<WebsiteService>;
  let mockUrlList: MockProxy<UrlList>;

  beforeEach(async () => {
    mockWebsiteService = mock<WebsiteService>();
    mockUrlList = mock<UrlList>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestService,
        {
          provide: WebsiteService,
          useValue: mockWebsiteService,
        },
        {
          provide: UrlList,
          useValue: mockUrlList,
        },
      ],
    }).compile();

    service = module.get<IngestService>(IngestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get a list of URLs', async () => {
    const csvString =
      'target_url,base_domain,top_level_domain,branch,agency,agency_code,bureau,bureau_code,source_list_federal_domains,source_list_dap,source_list_pulse,source_list_other,source_list_mil\n18f.gov,18f.gov,gov,Executive,General Services Administration,23,"GSA, TTS",,FALSE,FALSE,TRUE,FALSE,FALSE';

    jest
      .spyOn(mockUrlList, 'fetch')
      .mockImplementation(() => Promise.resolve(csvString));

    const result = await service.getUrls();

    expect(result).toStrictEqual(csvString);
  });

  it('write a list of URLs', async () => {
    const csvString =
      'target_url,base_domain,top_level_domain,branch,agency,agency_code,bureau,bureau_code,source_list_federal_domains,source_list_dap,source_list_pulse,source_list_other,source_list_mil\n18f.gov,18f.gov,gov,Executive,General Services Administration,23,"GSA, TTS",,FALSE,FALSE,TRUE,FALSE,FALSE';

    jest
      .spyOn(mockUrlList, 'fetch')
      .mockImplementation(() => Promise.resolve(csvString));

    jest
      .spyOn(mockWebsiteService, 'findAllWebsites')
      .mockImplementation(() => Promise.resolve([]));

    const urls = await service.getUrls();
    await service.writeUrls(urls);

    expect(mockWebsiteService.findNewestWebsite).toHaveBeenCalledTimes(1);
    expect(mockWebsiteService.upsert).toHaveBeenCalledTimes(1);
    expect(mockWebsiteService.deleteBefore).toHaveBeenCalledTimes(0);
  });

  it('write a list of URLs and removes invalid urls', async () => {
    const csvString =
      'target_url,base_domain,top_level_domain,branch,agency,agency_code,bureau,bureau_code,source_list_federal_domains,source_list_dap,source_list_pulse,source_list_other,source_list_mil\n18f.gov,18f.gov,gov,Executive,General Services Administration,23,"GSA, TTS",,FALSE,FALSE,TRUE,FALSE,FALSE';

    jest
      .spyOn(mockUrlList, 'fetch')
      .mockImplementation(() => Promise.resolve(csvString));

    const website = new Website();

    website.url = 'fake.gov';
    website.created = new Date('2021-01-01').toISOString();
    website.updated = new Date('2021-01-01').toISOString();
    website.branch = 'Executive';
    website.agency = 'General Services Administration';
    website.bureau = 'GSA, TTS';
    website.agencyCode = 10;
    website.bureauCode = 10;
    website.sourceList = 'gov';

    jest
      .spyOn(mockWebsiteService, 'findAllWebsites')
      .mockImplementation(() => Promise.resolve([]));

    jest
      .spyOn(mockWebsiteService, 'findNewestWebsite')
      .mockImplementation(() => Promise.resolve(website));

    jest
      .spyOn(mockWebsiteService, 'deleteBefore')
      .mockImplementation(() => Promise.resolve({ affected: 1, raw: '' }));

    const urls = await service.getUrls();
    await service.writeUrls(urls);

    expect(mockWebsiteService.findNewestWebsite).toHaveBeenCalledTimes(1);
    expect(mockWebsiteService.upsert).toHaveBeenCalledTimes(1);
    expect(mockWebsiteService.deleteBefore).toHaveBeenCalledTimes(1);
  });
});
