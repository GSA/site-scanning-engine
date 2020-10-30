import { CoreResult } from '@app/database/core-results/core-result.entity';
import { CoreResultService } from '@app/database/core-results/core-result.service';
import { Website } from '@app/database/websites/website.entity';
import { WebsiteService } from '@app/database/websites/websites.service';
import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy, mockReset } from 'jest-mock-extended';
import { fromCoreResult } from './website-result.mapper';
import { WebsiteController } from './website.controller';

describe('WebsiteController', () => {
  let websiteController: WebsiteController;
  let mockWebsiteService: MockProxy<WebsiteService>;
  let mockCoreResultsService: MockProxy<CoreResultService>;

  beforeEach(async () => {
    mockWebsiteService = mock<WebsiteService>();
    mockCoreResultsService = mock<CoreResultService>();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [WebsiteController],
      providers: [
        {
          provide: WebsiteService,
          useValue: mockWebsiteService,
        },
        {
          provide: CoreResultService,
          useValue: mockCoreResultsService,
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
      const website = new Website();

      website.url = '18f.gov';
      website.agency = 'General Services Administration';
      website.organization = 'GSA,FAS,Technology Transformation Service';
      website.type = 'Federal Agency - Executive';
      coreResult.website = website;
      coreResult.finalUrl = '18f.gsa.gov';
      coreResult.finalUrlBaseDomain = 'gsa.gov';
      coreResult.finalUrlIsLive = true;
      coreResult.finalUrlMIMEType = 'text/html; charset=utf-8';
      coreResult.finalUrlSameDomain = false;
      coreResult.finalUrlSameWebsite = false;
      coreResult.finalUrlStatusCode = 200;
      coreResult.targetUrlBaseDomain = '18f.gov';
      coreResult.targetUrlRedirects = true;

      mockCoreResultsService.findResultsWithWebsite
        .calledWith()
        .mockResolvedValue(Promise.resolve([coreResult]));

      const result = await websiteController.getResults();

      const expected = fromCoreResult(coreResult);

      expect(result).toStrictEqual([expected]);
    });
  });
});
