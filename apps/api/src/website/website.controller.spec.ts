import { WebsiteService } from '@app/database/websites/websites.service';
import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy, mockReset } from 'jest-mock-extended';
import { WebsiteController } from './website.controller';
import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { Pagination } from 'nestjs-typeorm-paginate';
import { ConfigService } from '@nestjs/config';

describe('WebsiteController', () => {
  let websiteController: WebsiteController;
  let mockWebsiteService: MockProxy<WebsiteService>;
  let website: Website;
  let paginated: Pagination<Website>;
  let mockConfigService: MockProxy<ConfigService>;

  beforeEach(async () => {
    mockWebsiteService = mock<WebsiteService>();
    mockConfigService = mock<ConfigService>();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [WebsiteController],
      providers: [
        {
          provide: WebsiteService,
          useValue: mockWebsiteService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    websiteController = app.get<WebsiteController>(WebsiteController);

    const coreResult = new CoreResult();
    coreResult.id = 1;
    website = new Website();
    website.coreResult = coreResult;
    paginated = new Pagination([website], {
      itemCount: 10,
      currentPage: 1,
      totalItems: 100,
      totalPages: 10,
      itemsPerPage: 10,
    });
  });

  afterEach(async () => {
    mockReset(mockWebsiteService);
  });

  describe('websites', () => {
    it('should return a list of results', async () => {
      mockWebsiteService.paginatedFilter.mockResolvedValue(paginated);

      const result = await websiteController.getResults({
        final_url_live: true,
      });

      expect(result).toStrictEqual(paginated);
    });

    it('should return a result by url', async () => {
      const url = '18f.gov';
      mockWebsiteService.findByUrl.mockResolvedValue(website);

      const result = await websiteController.getResultByUrl(url);

      expect(result).toStrictEqual(website);
    });
  });
});
