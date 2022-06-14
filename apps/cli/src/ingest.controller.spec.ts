import { MockProxy, mock } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';

import { IngestService } from '@app/ingest';
import { IngestController } from './ingest.controller';

describe('IngestController', () => {
  let ingestController: IngestController;
  let mockIngestService: MockProxy<IngestService>;

  beforeEach(async () => {
    mockIngestService = mock<IngestService>();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [IngestController],
      providers: [
        {
          provide: IngestService,
          useValue: mockIngestService,
        },
      ],
    }).compile();

    ingestController = app.get<IngestController>(IngestController);
  });

  describe('root', () => {
    it('should refresh Urls', async () => {
      await ingestController.refreshUrls();
      expect(mockIngestService.writeUrls).toHaveBeenCalled();
    });
  });
});
