import { Website } from '@app/database/websites/website.entity';
import { WebsiteService } from '@app/database/websites/websites.service';
import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy, mockReset } from 'jest-mock-extended';
import { WebsiteController } from './website.controller';

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
    it('should return a list of the websites', async () => {
      const website = new Website();
      website.url = 'https://18f.gsa.gov';
      website.agency = 'GSA';
      website.branch = 'Executive';

      mockWebsiteService.findAll
        .calledWith()
        .mockResolvedValue(Promise.resolve([website]));

      const result = await websiteController.getWebsites();

      expect(result).toStrictEqual([website]);
    });
  });
});
