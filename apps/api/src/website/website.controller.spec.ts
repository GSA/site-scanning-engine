import { CoreResultService } from '@app/database/core-results/core-result.service';
import { WebsiteService } from '@app/database/websites/websites.service';
import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy, mockReset } from 'jest-mock-extended';
import { WebsiteController } from './website.controller';
import { CoreResult } from 'entities/core-result.entity';
import { websiteSerializer } from './serializer';
import { UswdsResult } from 'entities/uswds-result.entity';
import { Website } from 'entities/website.entity';

describe('WebsiteController', () => {
  let websiteController: WebsiteController;
  let mockWebsiteService: MockProxy<WebsiteService>;

  beforeEach(async () => {
    mockWebsiteService = mock<WebsiteService>();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [WebsiteController],
      providers: [
        {
          provide: WebsiteService,
          useValue: mockWebsiteService,
        },
      ],
    }).compile();

    websiteController = app.get<WebsiteController>(WebsiteController);
  });

  afterEach(async () => {
    mockReset(mockWebsiteService);
  });

  describe('websites', () => {
    it('should return a list of results', async () => {
      const coreResult = new CoreResult();
      coreResult.id = 1;
      const uswdsResult = new UswdsResult();
      const website = new Website();

      website.coreResult = coreResult;
      website.uswdsResult = uswdsResult;

      mockWebsiteService.findAllWithResult
        .calledWith()
        .mockResolvedValue([website]);

      const result = await websiteController.getResults();
      const serialized = websiteSerializer(website);

      expect(result).toStrictEqual([serialized]);
    });
  });
});
