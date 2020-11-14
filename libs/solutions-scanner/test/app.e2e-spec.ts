import { ScanStatus } from '@app/core-scanner/scan-status';
import {
  SolutionsScannerModule,
  SolutionsScannerService,
} from 'libs/solutions-scanner/src';
import { SolutionsInputDto } from 'libs/solutions-scanner/src/solutions.input.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';

describe('SolutionsScanner (e2e)', () => {
  let service: SolutionsScannerService;
  let moduleFixture: TestingModule;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [SolutionsScannerModule],
    }).compile();

    service = moduleFixture.get<SolutionsScannerService>(
      SolutionsScannerService,
    );
  });

  afterAll(async () => {
    await service.onModuleDestroy();
    await moduleFixture.close();
  });

  it('returns results for a url', async () => {
    const input: SolutionsInputDto = {
      websiteId: 1,
      url: '18f.gov',
    };
    const website = new Website();
    website.id = input.websiteId;

    const expected = new SolutionsResult();
    expected.website = website;
    expected.usaClasses = 50;
    expected.uswdsString = 1;
    expected.uswdsTables = 0;
    expected.uswdsInlineCss = 0;
    expected.uswdsUsFlag = 20;
    expected.uswdsStringInCss = 20;
    expected.uswdsUsFlagInCss = 0;
    expected.uswdsMerriweatherFont = 5;
    expected.uswdsPublicSansFont = 20;
    expected.uswdsSourceSansFont = 5;
    expected.uswdsCount = 121;
    expected.status = ScanStatus.Completed;

    const result = await service.scan(input);
    expect(result).toStrictEqual(expected);
  });
});
