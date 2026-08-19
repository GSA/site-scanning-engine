import { WebsiteService } from '@app/database/websites/websites.service';
import { UrlListDataFetcher } from './url-list-data-fetcher';
import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';
import { IngestService } from './ingest.service';
import { Website } from 'entities/website.entity';

// Full 38-column CSV header matching the current federal-website-index output.
const CSV_HEADER_COLS = [
  'target_url',
  'base_domain',
  'top_level_domain',
  'branch',
  'agency',
  'bureau',
  'source_list_federal_domains',
  'source_list_dap',
  'source_list_pulse',
  'source_list_omb_idea',
  'source_list_eotw',
  'source_list_usagov',
  'source_list_gov_man',
  'source_list_uscourts',
  'source_list_oira',
  'source_list_other',
  'source_list_mil_1',
  'source_list_mil_2',
  'source_list_dod_public',
  'source_list_dotmil',
  'source_list_final_url_websites',
  'source_list_house_117th',
  'source_list_senate_117th',
  'source_list_gpo_fdlp',
  'source_list_cisa',
  'source_list_dod_2025',
  'source_list_dap_2',
  'source_list_usagov_clicks',
  'source_list_usagov_clicks_mil',
  'source_list_search_gov',
  'source_list_search_gov_mil',
  'source_list_public_inventory',
  'source_list_non_gov_mil',
  'source_list_govt_urls',
  'source_list_hyperlink_domains',
  'filtered',
  'pageviews',
  'visits',
];
const CSV_HEADERS = CSV_HEADER_COLS.join(',');

// A base row with all source flags FALSE.
const BASE_ROW_COLS = [
  '18f.gov',
  '18f.gov',
  'gov',
  'Executive',
  'General Services Administration',
  'GSA TTS',
  'FALSE', // source_list_federal_domains
  'FALSE', // source_list_dap
  'FALSE', // source_list_pulse
  'FALSE', // source_list_omb_idea
  'FALSE', // source_list_eotw
  'FALSE', // source_list_usagov
  'FALSE', // source_list_gov_man
  'FALSE', // source_list_uscourts
  'FALSE', // source_list_oira
  'FALSE', // source_list_other
  'FALSE', // source_list_mil_1
  'FALSE', // source_list_mil_2
  'FALSE', // source_list_dod_public
  'FALSE', // source_list_dotmil
  'FALSE', // source_list_final_url_websites
  'FALSE', // source_list_house_117th
  'FALSE', // source_list_senate_117th
  'FALSE', // source_list_gpo_fdlp
  'FALSE', // source_list_cisa
  'FALSE', // source_list_dod_2025
  'FALSE', // source_list_dap_2
  'FALSE', // source_list_usagov_clicks
  'FALSE', // source_list_usagov_clicks_mil
  'FALSE', // source_list_search_gov
  'FALSE', // source_list_search_gov_mil
  'FALSE', // source_list_public_inventory
  'FALSE', // source_list_non_gov_mil
  'FALSE', // source_list_govt_urls
  'FALSE', // source_list_hyperlink_domains
  '',      // filtered
  '',      // pageviews
  '',      // visits
];

// Produces a row with one named column set to TRUE.
// Used by the general ingest tests that need a parseable row.
function rowWithColTrue(colName: string): string {
  const idx = CSV_HEADER_COLS.indexOf(colName);
  if (idx === -1) throw new Error(`Unknown column: ${colName}`);
  const cols = [...BASE_ROW_COLS];
  cols[idx] = 'TRUE';
  return cols.join(',');
}

// Produces a row with multiple named columns set to TRUE.
function rowWithColsTrue(colNames: string[]): string {
  const cols = [...BASE_ROW_COLS];
  for (const colName of colNames) {
    const idx = CSV_HEADER_COLS.indexOf(colName);
    if (idx === -1) throw new Error(`Unknown column: ${colName}`);
    cols[idx] = 'TRUE';
  }
  return cols.join(',');
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
    const csvString = `${CSV_HEADERS}\n${rowWithColTrue('source_list_federal_domains')}`;

    jest
      .spyOn(mockUrlList, 'fetch')
      .mockImplementation(() => Promise.resolve(csvString));

    const result = await service.getUrls();

    expect(result).toStrictEqual(csvString);
  });

  it('write a list of URLs', async () => {
    const csvString = `${CSV_HEADERS}\n${rowWithColTrue('source_list_federal_domains')}`;

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
    const csvString = `${CSV_HEADERS}\n${rowWithColTrue('source_list_federal_domains')}`;

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

  describe('getSourceList label mapping', () => {
    const cases: Array<[string, string]> = [
      ['source_list_federal_domains', 'gov'],
      ['source_list_dap',            'dap'],
      ['source_list_pulse',          'pulse'],
      ['source_list_omb_idea',       'omb_idea'],
      ['source_list_eotw',           '2020_eot'],
      ['source_list_usagov',         'usagov'],
      ['source_list_gov_man',        'gov_man'],
      ['source_list_uscourts',       'uscourts'],
      ['source_list_oira',           'oira'],
      ['source_list_other',          'other'],
      ['source_list_mil_1',          'mil-sites1'],
      ['source_list_mil_2',          'mil-sites2'],
      ['source_list_dod_public',     'dod_public'],
      ['source_list_dotmil',         'dotmil'],
      ['source_list_final_url_websites', 'final_url_websites'],
      ['source_list_house_117th',    'house_117th'],
      ['source_list_senate_117th',   'senate_117th'],
      ['source_list_gpo_fdlp',       'gpo_fdlp'],
      ['source_list_cisa',           'cisa'],
      ['source_list_dod_2025',       'dod_2025'],
      ['source_list_dap_2',          'dap2'],
      ['source_list_usagov_clicks',      'usagov_clicks'],
      ['source_list_usagov_clicks_mil',  'usagov_clicks_mil'],
      ['source_list_search_gov',         'searchgov'],
      ['source_list_search_gov_mil',     'searchgov_mil'],
      ['source_list_public_inventory',   'public_inventory'],
      ['source_list_non_gov_mil',        'non_govmil'],
      ['source_list_govt_urls',          'govt_urls'],
      ['source_list_hyperlink_domains',  'hyperlink_domains'],
    ];

    it.each(cases)(
      'column %s produces label "%s"',
      async (csvCol, expectedLabel) => {
        const csvString = `${CSV_HEADERS}\n${rowWithColTrue(csvCol)}`;

        jest
          .spyOn(mockWebsiteService, 'findAllWebsites')
          .mockImplementation(() => Promise.resolve([]));

        await service.writeUrls(csvString);

        expect(mockWebsiteService.upsert).toHaveBeenCalledWith(
          expect.objectContaining({ sourceList: expectedLabel }),
        );
      },
    );

    it('produces a comma-separated list when multiple source flags are TRUE', async () => {
      const csvString = `${CSV_HEADERS}\n${rowWithColsTrue([
        'source_list_federal_domains',
        'source_list_dap',
        'source_list_cisa',
      ])}`;

      jest
        .spyOn(mockWebsiteService, 'findAllWebsites')
        .mockImplementation(() => Promise.resolve([]));

      await service.writeUrls(csvString);

      expect(mockWebsiteService.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ sourceList: 'gov,dap,cisa' }),
      );
    });

    it('produces an empty string when no source flags are TRUE', async () => {
      const csvString = `${CSV_HEADERS}\n${BASE_ROW_COLS.join(',')}`;

      jest
        .spyOn(mockWebsiteService, 'findAllWebsites')
        .mockImplementation(() => Promise.resolve([]));

      await service.writeUrls(csvString);

      expect(mockWebsiteService.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ sourceList: '' }),
      );
    });

    it('treats TRUE case-insensitively (lowercase "true")', async () => {
      const cols = [...BASE_ROW_COLS];
      const idx = CSV_HEADER_COLS.indexOf('source_list_federal_domains');
      cols[idx] = 'true';
      const csvString = `${CSV_HEADERS}\n${cols.join(',')}`;

      jest
        .spyOn(mockWebsiteService, 'findAllWebsites')
        .mockImplementation(() => Promise.resolve([]));

      await service.writeUrls(csvString);

      expect(mockWebsiteService.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ sourceList: 'gov' }),
      );
    });
  });

  describe('writeUrls Promise settlement', () => {
    it('resolves even when the CSV contains a parse error', async () => {
      // A row with fewer columns than expected triggers a fast-csv parse error.
      const malformedCsv = `${CSV_HEADERS}\nbad,row`;

      jest
        .spyOn(mockWebsiteService, 'findAllWebsites')
        .mockImplementation(() => Promise.resolve([]));

      // If the bug is present this will never resolve and Jest will timeout.
      await expect(service.writeUrls(malformedCsv)).resolves.not.toThrow();
    });

    it('rejects when findAllWebsites throws, instead of hanging', async () => {
      const csvString = `${CSV_HEADERS}\n${rowWithColTrue('source_list_federal_domains')}`;

      jest
        .spyOn(mockWebsiteService, 'findAllWebsites')
        .mockImplementation(() => Promise.reject(new Error('DB down')));

      // Should reject promptly — never hang indefinitely.
      await expect(service.writeUrls(csvString)).rejects.toThrow('DB down');
    });
  });
});
