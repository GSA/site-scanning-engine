import { WebsiteService } from '@app/database/websites/websites.service';
import { HttpService } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';
import { IngestService } from './ingest.service';
import { Website } from 'entities/website.entity';

describe('IngestService', () => {
  let service: IngestService;
  let mockHttpService: MockProxy<HttpService>;
  let mockWebsiteService: MockProxy<WebsiteService>;

  beforeEach(async () => {
    mockHttpService = mock<HttpService>();
    mockWebsiteService = mock<WebsiteService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestService,
        {
          provide: WebsiteService,
          useValue: mockWebsiteService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<IngestService>(IngestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getInvalidWebsiteIds', () => {
    it('gets the id for a website with an invalid url', () => {
      const firstWebsite = new Website();
      const secondWebsite = new Website();
      const thirdWebsite = new Website();
      firstWebsite.id = 1;
      firstWebsite.url = 'foo.gov';
      secondWebsite.id = 2;
      secondWebsite.url = 'bar.gov';
      thirdWebsite.id = 3;
      thirdWebsite.url = 'baz.gov';
      const currentWebsites = [firstWebsite, secondWebsite, thirdWebsite];
      const validUrls = ['foo.gov', 'bar.gov'];

      const result = service.getInvalidWebsiteIds(currentWebsites, validUrls);

      expect(result).toEqual([3]);
    });

    it('gets the ids for multiple websites with invalid urls', () => {
      const firstWebsite = new Website();
      const secondWebsite = new Website();
      const thirdWebsite = new Website();
      const fourthWebsite = new Website();
      firstWebsite.id = 1;
      firstWebsite.url = 'foo.gov';
      secondWebsite.id = 2;
      secondWebsite.url = 'bar.gov';
      thirdWebsite.id = 3;
      thirdWebsite.url = 'baz.gov';
      fourthWebsite.id = 4;
      fourthWebsite.url = 'buzz.gov';
      const currentWebsites = [
        firstWebsite,
        secondWebsite,
        thirdWebsite,
        fourthWebsite,
      ];
      const validUrls = ['foo.gov', 'bar.gov'];

      const result = service.getInvalidWebsiteIds(currentWebsites, validUrls);

      expect(result).toEqual([3, 4]);
    });

    it('returns an empty array if there are no websites with invalid urls', () => {
      const firstWebsite = new Website();
      const secondWebsite = new Website();
      firstWebsite.id = 1;
      firstWebsite.url = 'foo.gov';
      secondWebsite.id = 2;
      secondWebsite.url = 'bar.gov';
      const currentWebsites = [firstWebsite, secondWebsite];
      const validUrls = ['foo.gov', 'bar.gov'];

      const result = service.getInvalidWebsiteIds(currentWebsites, validUrls);

      expect(result).toEqual([]);
    });
  });
});
