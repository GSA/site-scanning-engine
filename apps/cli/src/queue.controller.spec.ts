import { Test, TestingModule } from '@nestjs/testing';
import { MockProxy, mock } from 'jest-mock-extended';

import { WebsiteService } from '@app/database/websites/websites.service';
import { QueueService } from '@app/queue';

import { QueueController } from './queue.controller';
import { Website } from 'entities/website.entity';

describe('QueueController', () => {
  let queueController: QueueController;
  let mockQueueService: MockProxy<QueueService>;
  let mockWebsiteService: MockProxy<WebsiteService>;

  beforeEach(async () => {
    mockQueueService = mock<QueueService>();
    mockWebsiteService = mock<WebsiteService>();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [QueueController],
      providers: [
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
        {
          provide: WebsiteService,
          useValue: mockWebsiteService,
        },
      ],
    }).compile();
    queueController = app.get<QueueController>(QueueController);
  });

  describe('queue controller', () => {
    it('clearQueue should clear queue', async () => {
      await queueController.clearQueue();
      expect(mockQueueService.emptyAndClean).toHaveBeenCalled();
    });
    it('queueScans should enqueue scan jobs', async () => {
      mockWebsiteService.findAllWebsites.mockResolvedValue(
        Promise.resolve([new Website(), new Website()]),
      );
      await queueController.queueScans();
      expect(mockWebsiteService.findAllWebsites).toHaveBeenCalled();
      expect(mockQueueService.addCoreJob).toHaveBeenCalledTimes(2);
    });
  });
});
