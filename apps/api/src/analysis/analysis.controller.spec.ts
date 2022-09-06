import { AnalysisService } from '@app/database/analysis/analysis.service';
import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy, mockReset } from 'jest-mock-extended';
import { AnalysisController } from './analysis.controller';
import { ConfigService } from '@nestjs/config';

describe('WebsiteController', () => {
  let controller: AnalysisController;
  let mockAnalysisService: MockProxy<AnalysisService>;
  let mockConfigService: MockProxy<ConfigService>;

  beforeEach(async () => {
    mockAnalysisService = mock<AnalysisService>();
    mockConfigService = mock<ConfigService>();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [
        {
          provide: AnalysisService,
          useValue: mockAnalysisService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = app.get<AnalysisController>(AnalysisController);
  });

  afterEach(async () => {
    mockReset(mockAnalysisService);
  });

  describe('analysis', () => {
    it('should return a response', async () => {
      const expectedResult = {
        total: 1,
        totalFinalUrlBaseDomains: 1,
        totalAgencies: 1,
      };

      mockAnalysisService.getWebsiteAnalysis.mockResolvedValue(expectedResult);

      const result = await controller.getResults({});

      expect(result).toStrictEqual(expectedResult);
    });
  });
});
