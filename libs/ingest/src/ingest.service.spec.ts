import { WebsiteService } from '@app/database/websites/websites.service';
import { UrlListDataFetcher } from './url-list-data-fetcher';
import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';
import { IngestService } from './ingest.service';
import { Website } from 'entities/website.entity';

// Full 38-column CSV header matching the current federal-website-index output.
const CSV_HEADERS =
  'target_url,base_domain,top_level_domain,branch,agency,bureau,' +
  'source_list_federal_domains,source_list_dap,source_list_pulse,source_list_omb_idea,' +
  'source_list_eotw,source_list_usagov,source_list_gov_man,source_list_uscourts,' +
  'source_list_oira,source_list_other,source_list_mil_1,source_list_mil_2,' +
  'source_list_dod_public,source_list_dotmil,source_list_final_url_websites,' +
  'source_list_house_117th,source_list_senate_117th,source_list_gpo_fdlp,' +
  'source_list_cisa,source_list_dod_2025,source_list_dap_2,source_list_usagov_clicks,' +
  'source_list_usagov_clicks_mil,source_list_search_gov,source_list_search_gov_mil,' +
  'source_list_public_inventory,source_list_non_gov_mil,source_list_govt_urls,' +
  'source_list_hyperlink_domains,' +
  'filtered,pageviews,visits';

// A base row with all source flags FALSE.
const BASE_ROW =
  '18f.gov,18f.gov,gov,Executive,General Services Administration,GSA TTS,' +
  'FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,' +
  'FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,' +
  'FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,,';

// Produces a row where source_list_federal_domains=TRUE. Used by the three
// general ingest tests that need a parseable row but don't assert on sourceList.
function rowWithFederalTrue() {
  return BASE_ROW.replace(
    /^(18f\.gov,18f\.gov,gov,Executive,General Services Administration,GSA TTS,)FALSE/,
    '$1TRUE',
  );
}

function rowWithHyperlinkTrue() {
  // source_list_hyperlink_domains is the 35th column (0-indexed: 34).
  // Replace the FALSE immediately before ',FALSE,,' (filtered,pageviews,visits)
  return BASE_ROW.replace(/FALSE,FALSE,,$/, 'TRUE,FALSE,,');
}

describe('IngestService', () => {
  let service: IngestService;
  let mockWebsiteService: MockProxy<WebsiteService>;
  let mockUrlList: MockProxy<UrlListDataFetcher>;

  beforeEach(async () => {
    mockWebsiteService = mock<WebsiteService>();
    mockUrlList = mock<UrlListDataFetcher>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestService,
        {
          provide: WebsiteService,
          useValue: mockWebsiteService,
        },
        {
          provide: UrlListDataFetcher,
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
    const csvString = `${CSV_HEADERS}\n${rowWithFederalTrue()}`;

    jest
      .spyOn(mockUrlList, 'fetch')
      .mockImplementation(() => Promise.resolve(csvString));

    const result = await service.getUrls();

    expect(result).toStrictEqual(csvString);
  });

  it('write a list of URLs', async () => {
    const csvString = `${CSV_HEADERS}\n${rowWithFederalTrue()}`;

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
    const csvString = `${CSV_HEADERS}\n${rowWithFederalTrue()}`;

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

  it('sets sourceList to hyperlink_domains when source_list_hyperlink_domains is TRUE', async () => {
    const csvString = `${CSV_HEADERS}\n${rowWithHyperlinkTrue()}`;

    jest
      .spyOn(mockUrlList, 'fetch')
      .mockImplementation(() => Promise.resolve(csvString));

    jest
      .spyOn(mockWebsiteService, 'findAllWebsites')
      .mockImplementation(() => Promise.resolve([]));

    const urls = await service.getUrls();
    await service.writeUrls(urls);

    expect(mockWebsiteService.upsert).toHaveBeenCalledTimes(1);

    const upsertArg = (mockWebsiteService.upsert as jest.Mock).mock.calls[0][0];
    expect(upsertArg.sourceList).toBe('hyperlink_domains');
  });
});
