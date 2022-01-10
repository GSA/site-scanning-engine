import { Test, TestingModule } from '@nestjs/testing';
import { MockProxy, mock } from 'jest-mock-extended';

import { WebsiteService } from '@app/database/websites/websites.service';
import { LoggerService } from '@app/logger';
import { ProducerService } from '@app/producer';

import { QueueController } from './queue.controller';
import { Website } from 'entities/website.entity';

describe('QueueController', () => {
  let queueController: QueueController;
  let mockProducerService: MockProxy<ProducerService>;
  let mockWebsiteService: MockProxy<WebsiteService>;
  let mockLogger: MockProxy<LoggerService>;

  beforeEach(async () => {
    mockProducerService = mock<ProducerService>();
    mockWebsiteService = mock<WebsiteService>();
    mockLogger = mock<LoggerService>();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [QueueController],
      providers: [
        {
          provide: ProducerService,
          useValue: mockProducerService,
        },
        {
          provide: WebsiteService,
          useValue: mockWebsiteService,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();
    queueController = app.get<QueueController>(QueueController);
  });

  describe('queue controller', () => {
    it('clearQueue should clear queue', async () => {
      await queueController.clearQueue();
      expect(mockProducerService.emptyAndClean).toHaveBeenCalled();
    });
    it('queueScans should queue scan jobs', async () => {
      mockWebsiteService.findAllWebsites.mockResolvedValue(
        Promise.resolve([new Website(), new Website()]),
      );
      await queueController.queueScans();
      expect(mockWebsiteService.findAllWebsites).toHaveBeenCalled();
      expect(mockProducerService.addCoreJob).toHaveBeenCalledTimes(2);
    });
  });
});
