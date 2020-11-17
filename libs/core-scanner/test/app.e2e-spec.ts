import { CoreScannerModule, CoreScannerService } from '@app/core-scanner';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { LoggerService } from '@app/logger';
import { Test, TestingModule } from '@nestjs/testing';
import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { noop } from 'lodash';

describe('CoreScanner (e2e)', () => {
  let service: CoreScannerService;
  let logger: LoggerService;
  let moduleFixture: TestingModule;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [CoreScannerModule],
    }).compile();

    service = moduleFixture.get<CoreScannerService>(CoreScannerService);
    logger = moduleFixture.get<LoggerService>(LoggerService);

    jest.spyOn(logger, 'debug').mockImplementation(noop);
  });

  afterAll(async () => {
    await service.onModuleDestroy();
    await moduleFixture.close();
  });

  it('returns results for a url', async () => {
    const input: CoreInputDto = {
      websiteId: 1,
      url: '18f.gov',
    };
    const website = new Website();
    website.id = input.websiteId;

    const expected = new CoreResult();
    expected.finalUrl = 'https://18f.gsa.gov/';
    expected.finalUrlBaseDomain = 'gsa.gov';
    expected.finalUrlIsLive = true;
    expected.finalUrlMIMEType = 'text/html';
    expected.finalUrlSameDomain = false;
    expected.finalUrlSameWebsite = false;
    expected.finalUrlStatusCode = 200;
    expected.status = 'completed';
    expected.targetUrl404Test = true;
    expected.targetUrlBaseDomain = '18f.gov';
    expected.targetUrlRedirects = true;
    expected.website = website;

    const result = await service.scan(input);
    expect(result).toStrictEqual(expected);
  });
});
