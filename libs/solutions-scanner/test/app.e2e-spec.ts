import { ScanStatus } from '@app/core-scanner/scan-status';
import {
  SolutionsScannerModule,
  SolutionsScannerService,
} from 'libs/solutions-scanner/src';
import { SolutionsInputDto } from 'libs/solutions-scanner/src/solutions.input.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';
import { LoggerService } from '@app/logger';
import { noop } from 'lodash';

describe('SolutionsScanner (e2e)', () => {
  let service: SolutionsScannerService;
  let moduleFixture: TestingModule;
  let logger: LoggerService;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [SolutionsScannerModule],
    }).compile();

    service = moduleFixture.get<SolutionsScannerService>(
      SolutionsScannerService,
    );
    logger = moduleFixture.get<LoggerService>(LoggerService);

    jest.spyOn(logger, 'debug').mockImplementation(noop);
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
    expected.uswdsSemanticVersion = '2.9.0';
    expected.uswdsVersion = 20;
    expected.uswdsCount = 141;
    expected.status = ScanStatus.Completed;
    expected.dapDetected = true;
    expected.dapParameters = 'agency=GSA&subagency=TTS%2C18F';
    expected.ogTitleFinalUrl = '18F: Digital service delivery | Home';
    expected.ogDescriptionFinalUrl =
      '18F builds effective, user-centric digital services focused on the interaction between government and the people and businesses it serves.';
    expected.mainElementFinalUrl = false;
    expected.robotsTxtFinalUrl = 'https://18f.gsa.gov/robots.txt';

    const result = await service.scan(input);
    expect(result).toStrictEqual(expected);
  });
});
