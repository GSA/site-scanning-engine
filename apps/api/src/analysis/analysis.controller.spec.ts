import { AnalysisService } from '@app/database/analysis/analysis.service';
import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy, mockReset } from 'jest-mock-extended';
import { AnalysisController } from './analysis.controller';
import { ConfigService } from '@nestjs/config';
import { QueueService } from '@app/queue/queue.service';

describe('WebsiteController', () => {
  let controller: AnalysisController;
  let mockAnalysisService: MockProxy<AnalysisService>;
  let mockQueueService: MockProxy<QueueService>;
  let mockConfigService: MockProxy<ConfigService>;

  beforeEach(async () => {
    mockAnalysisService = mock<AnalysisService>();
    mockQueueService = mock<QueueService>();
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
      const expectedQueueCounts = {
        waiting: 0,
        active: 0,
        delayed: 0,
        failed: 0,
      };
      mockQueueService.getQueueCounts.mockResolvedValue(expectedQueueCounts);

      const expectedAnalysisResult = {
        total: 1,
        totalFinalUrlBaseDomains: 1,
        totalAgencies: 1,
        queueCounts: expectedQueueCounts,
      };

      mockAnalysisService.getWebsiteAnalysis.mockResolvedValue(
        expectedAnalysisResult,
      );

      const result = await controller.getResults({});

      expect(result).toStrictEqual(expectedAnalysisResult);
    });
  });
});
