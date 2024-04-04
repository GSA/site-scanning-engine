import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { Connection, createConnection, Repository } from 'typeorm';
import { WebsiteService } from './websites.service';
import { ScanStatus } from 'entities/scan-status';

describe('AnalysisService', () => {
  let db: Connection;
  let websiteRepository: Repository<Website>;
  let coreResultRepository: Repository<CoreResult>;
  let service: WebsiteService;

  beforeEach(async () => {
    db = await createConnection({
      type: 'sqlite',
      database: ':memory:',
      entities: [CoreResult, Website],
      dropSchema: true,
      synchronize: true,
      logging: false,
    });

    websiteRepository = await db.getRepository(Website);
    coreResultRepository = await db.getRepository(CoreResult);
    service = new WebsiteService(websiteRepository);
  });

  afterEach(() => db.destroy());

  it('repository should be defined', () => {
    expect(websiteRepository).toBeDefined();
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  it('get only live snapshot website results with the appropriate tld', async () => {
    const firstWebsite = new Website();
    firstWebsite.url = 'https://18f.gov';
    firstWebsite.topLevelDomain = 'gov';
    firstWebsite.branch = 'Federal Agency - Executive';
    firstWebsite.agency = 'General Services Administration';
    firstWebsite.bureau = 'GSA,FAS,Technology Transformation Service';
    firstWebsite.agencyCode = 10;
    firstWebsite.bureauCode = 10;
    firstWebsite.sourceList = 'gov';
    firstWebsite.ombIdeaPublic = false;

    const secondWebsite = new Website();
    secondWebsite.url = 'https://fake.gov';
    secondWebsite.topLevelDomain = 'gov';
    secondWebsite.branch = 'Federal Agency - Executive';
    secondWebsite.agency = 'Fake Agency';
    secondWebsite.bureau = 'GSA,FAS,Technology Transformation Service';
    secondWebsite.agencyCode = 10;
    secondWebsite.bureauCode = 10;
    secondWebsite.sourceList = 'gov';
    secondWebsite.ombIdeaPublic = false;

    const thirdWebsite = new Website();
    thirdWebsite.url = 'https://anotherfake.gov';
    thirdWebsite.topLevelDomain = 'gov';
    thirdWebsite.branch = 'Federal Agency - Executive';
    thirdWebsite.agency = 'Fake Agency';
    thirdWebsite.bureau = 'GSA,FAS,Technology Transformation Service';
    thirdWebsite.agencyCode = 10;
    thirdWebsite.bureauCode = 10;
    thirdWebsite.sourceList = 'gov';
    thirdWebsite.ombIdeaPublic = false;

    const fourthWebsite = new Website();
    fourthWebsite.url = 'https://anotherfake.mil';
    fourthWebsite.topLevelDomain = 'mil';
    fourthWebsite.agency = 'Fake Agency';
    fourthWebsite.branch = 'fake';
    fourthWebsite.bureau = 'fake';
    fourthWebsite.agencyCode = 10;
    fourthWebsite.bureauCode = 10;
    fourthWebsite.sourceList = 'mil';
    fourthWebsite.ombIdeaPublic = false;

    const firstCoreResult = new CoreResult();
    firstCoreResult.website = firstWebsite;
    firstCoreResult.finalUrlIsLive = true;
    firstCoreResult.notFoundScanStatus = 'complete';
    firstCoreResult.primaryScanStatus = 'complete';
    firstCoreResult.robotsTxtScanStatus = 'complete';
    firstCoreResult.sitemapXmlScanStatus = 'complete';
    firstCoreResult.targetUrlBaseDomain = 'complete';
    firstCoreResult.finalUrlMIMEType = 'text/html';

    const secondCoreResult = new CoreResult();
    secondCoreResult.website = secondWebsite;
    secondCoreResult.finalUrlIsLive = false;
    secondCoreResult.notFoundScanStatus = 'complete';
    secondCoreResult.primaryScanStatus = 'complete';
    secondCoreResult.robotsTxtScanStatus = 'complete';
    secondCoreResult.sitemapXmlScanStatus = 'complete';
    secondCoreResult.targetUrlBaseDomain = 'complete';
    secondCoreResult.finalUrlMIMEType = 'text/html';

    const thirdCoreResult = new CoreResult();
    thirdCoreResult.website = thirdWebsite;
    thirdCoreResult.finalUrlIsLive = true;
    thirdCoreResult.notFoundScanStatus = 'complete';
    thirdCoreResult.primaryScanStatus = 'complete';
    thirdCoreResult.robotsTxtScanStatus = 'complete';
    thirdCoreResult.sitemapXmlScanStatus = 'complete';
    thirdCoreResult.targetUrlBaseDomain = 'complete';
    thirdCoreResult.finalUrlMIMEType = 'application/json';

    const fourthCoreResult = new CoreResult();
    fourthCoreResult.website = fourthWebsite;
    fourthCoreResult.finalUrlIsLive = true;
    fourthCoreResult.notFoundScanStatus = 'complete';
    fourthCoreResult.primaryScanStatus = 'complete';
    fourthCoreResult.robotsTxtScanStatus = 'complete';
    fourthCoreResult.sitemapXmlScanStatus = 'complete';
    fourthCoreResult.targetUrlBaseDomain = 'complete';
    fourthCoreResult.finalUrlMIMEType = 'application/html';

    await websiteRepository.insert(firstWebsite);
    await coreResultRepository.insert(firstCoreResult);
    await websiteRepository.insert(secondWebsite);
    await coreResultRepository.insert(secondCoreResult);
    await websiteRepository.insert(thirdWebsite);
    await coreResultRepository.insert(thirdCoreResult);
    await websiteRepository.insert(fourthWebsite);
    await coreResultRepository.insert(fourthCoreResult);

    const result = await service.findLiveSnapshotResults();

    expect(result.length).toStrictEqual(2);
  });

  it('gets only live snapshot website results with successful a11y scan results', async () => {
    const firstWebsite = new Website();
    firstWebsite.url = 'https://18f.gov';
    firstWebsite.topLevelDomain = 'gov';
    firstWebsite.branch = 'Federal Agency - Executive';
    firstWebsite.agency = 'General Services Administration';
    firstWebsite.bureau = 'GSA,FAS,Technology Transformation Service';
    firstWebsite.agencyCode = 10;
    firstWebsite.bureauCode = 10;
    firstWebsite.sourceList = 'gov';
    firstWebsite.ombIdeaPublic = false;

    const secondWebsite = new Website();
    secondWebsite.url = 'https://fake.gov';
    secondWebsite.topLevelDomain = 'gov';
    secondWebsite.branch = 'Federal Agency - Executive';
    secondWebsite.agency = 'Fake Agency';
    secondWebsite.bureau = 'GSA,FAS,Technology Transformation Service';
    secondWebsite.agencyCode = 10;
    secondWebsite.bureauCode = 10;
    secondWebsite.sourceList = 'gov';
    secondWebsite.ombIdeaPublic = false;

    const firstCoreResult = new CoreResult();
    firstCoreResult.website = firstWebsite;
    firstCoreResult.finalUrlIsLive = true;
    firstCoreResult.notFoundScanStatus = 'complete';
    firstCoreResult.primaryScanStatus = 'complete';
    firstCoreResult.robotsTxtScanStatus = 'complete';
    firstCoreResult.sitemapXmlScanStatus = 'complete';
    firstCoreResult.targetUrlBaseDomain = 'complete';
    firstCoreResult.finalUrlMIMEType = 'text/html';
    firstCoreResult.accessibilityScanStatus = ScanStatus.Completed;
    const accessibilityResultsList = [
      {
        id: 'html-has-lang',
        tags: [
          'cat.language',
          'wcag2a',
          'wcag311',
          'TTv5',
          'TT11.a',
          'EN-301-549',
          'EN-9.3.1.1',
          'ACT',
        ],
        description: 'Ensures every HTML document has a lang attribute',
        helpUrl:
          'https://dequeuniversity.com/rules/axe/4.8/html-has-lang?application=axe-puppeteer',
        nodes: [
          {
            any: [
              {
                id: 'has-lang',
                relatedNodes: [
                  {
                    html: '<article class="post-717 page type-page status-publish has-post-thumbnail entry" itemscope="" itemtype="https://schema.org/CreativeWork">',
                  },
                ],
                message: 'The <html> element does not have a lang attribute',
              },
            ],
            all: [],
            none: [],
            html: '<html>',
          },
        ],
      },
    ];
    firstCoreResult.accessibilityResultsList = JSON.stringify(
      accessibilityResultsList,
    );

    const secondCoreResult = new CoreResult();
    secondCoreResult.website = secondWebsite;
    secondCoreResult.finalUrlIsLive = false;
    secondCoreResult.notFoundScanStatus = 'complete';
    secondCoreResult.primaryScanStatus = 'complete';
    secondCoreResult.robotsTxtScanStatus = 'complete';
    secondCoreResult.sitemapXmlScanStatus = 'complete';
    secondCoreResult.targetUrlBaseDomain = 'complete';
    secondCoreResult.finalUrlMIMEType = 'text/html';
    secondCoreResult.accessibilityScanStatus = ScanStatus.UnknownError;
    secondCoreResult.accessibilityResultsList = '';

    await websiteRepository.insert(firstWebsite);
    await coreResultRepository.insert(firstCoreResult);
    await websiteRepository.insert(secondWebsite);
    await coreResultRepository.insert(secondCoreResult);

    const result = await service.findAccessibilityResultsSnapshotResults();

    expect(result.length).toStrictEqual(1);
  });
});
