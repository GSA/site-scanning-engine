import { MockProxy, mock } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { DataFreshnessController } from './data-freshness.controller';
import { CoreResultService } from '@app/database/core-results/core-result.service';
import { fetchCommitDate } from '@app/security-data/fetch-commit-date';

jest.mock('@app/security-data/fetch-commit-date');

describe('DataFreshnessController', () => {
  let controller: DataFreshnessController;
  let mockCoreResultService: MockProxy<CoreResultService>;
  let mockedFetchCommitDate: jest.MockedFunction<typeof fetchCommitDate>;

  beforeEach(async () => {
    mockCoreResultService = mock<CoreResultService>();
    mockedFetchCommitDate = fetchCommitDate as jest.MockedFunction<
      typeof fetchCommitDate
    >;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataFreshnessController],
      providers: [
        {
          provide: CoreResultService,
          useValue: mockCoreResultService,
        },
      ],
    }).compile();

    controller = module.get<DataFreshnessController>(DataFreshnessController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateDataFreshnessDates', () => {
    it('should fetch dates and update core results', async () => {
      mockedFetchCommitDate
        .mockResolvedValueOnce('2024-01-01') // DAP
        .mockResolvedValueOnce('2024-01-02'); // HTTPS

      await controller.updateDataFreshnessDates();

      expect(mockedFetchCommitDate).toHaveBeenCalledTimes(2);
      expect(mockedFetchCommitDate).toHaveBeenCalledWith(
        'data/source-lists/dap_top_100000_domains_30_days.csv',
        expect.anything(),
      );
      expect(mockedFetchCommitDate).toHaveBeenCalledWith(
        'data/source-lists/cisa_https.csv',
        expect.anything(),
      );

      expect(mockCoreResultService.updateDataFreshnessDates).toHaveBeenCalledWith(
        '2024-01-01',
        '2024-01-02',
      );
    });

    it('should throw an error if fetchCommitDate fails', async () => {
      mockedFetchCommitDate.mockRejectedValue(new Error('GitHub API Error'));

      await expect(controller.updateDataFreshnessDates()).rejects.toThrow(
        'GitHub API Error',
      );
      expect(
        mockCoreResultService.updateDataFreshnessDates,
      ).not.toHaveBeenCalled();
    });
  });
});
