import { CoreResult } from '@app/database/core-results/core-result.entity';
import { CoreResultService } from '@app/database/core-results/core-result.service';
import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy, mockReset } from 'jest-mock-extended';
import { ResultsController } from './results.controller';

describe('ResultsController', () => {
  let controller: ResultsController;
  let mockResultsService: MockProxy<CoreResultService>;

  beforeEach(async () => {
    mockResultsService = mock<CoreResultService>();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResultsController],
      providers: [
        {
          provide: CoreResultService,
          useValue: mockResultsService,
        },
      ],
    }).compile();

    controller = module.get<ResultsController>(ResultsController);
  });

  afterEach(async () => {
    mockReset(mockResultsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return a list of results', async () => {
    const coreResult = new CoreResult();
    const date = new Date();
    coreResult.agency = 'GSA';
    coreResult.branch = 'Executive';
    coreResult.created = date.toDateString();
    coreResult.updated = date.toDateString();
    coreResult.id = 1;
    coreResult.targetUrl = 'https://18f.gov';
    coreResult.finalUrl = 'https://18f.gsa.gov';
    const expected = [coreResult];
    mockResultsService.findAll.calledWith().mockResolvedValue(expected);
    const result = await controller.getResults();
    expect(result).toStrictEqual(expected);
  });
});
