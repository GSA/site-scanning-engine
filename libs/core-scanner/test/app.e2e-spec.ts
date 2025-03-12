import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';

import { BrowserModule } from '@app/browser';
import { CoreScannerModule, CoreScannerService } from '@app/core-scanner';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { ScanStatus } from 'entities/scan-status';

const E2E_TEST_TIMEOUT = 30 * 1000; // 30 sec

describe('CoreScanner (e2e)', () => {
  let service: CoreScannerService;
  let moduleFixture: TestingModule;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [BrowserModule, CoreScannerModule, LoggerModule.forRoot()],
    }).compile();

    service = moduleFixture.get<CoreScannerService>(CoreScannerService);
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('should return results for 10x.gsa.gov', async () => {
    const input: CoreInputDto = {
      websiteId: 1,
      url: '10x.gsa.gov',
      filter: false,
      pageviews: 1,
      visits: 1,
      scanId: '123',
    };

    const result = await service.scan(input);
    expect(result).toMatchObject({
      base: {
        targetUrlBaseDomain: 'gsa.gov',
      },
      primary: {
        status: ScanStatus.Completed,
      },
      dns: {
        status: ScanStatus.Completed,
      },
      notFound: {
        status: ScanStatus.Completed,
      },
      robotsTxt: {
        status: ScanStatus.Completed,
      },
      sitemapXml: {
        status: ScanStatus.Completed,
      },
    });
  }, E2E_TEST_TIMEOUT);

  it('returns results for poolsafety.gov', async () => {
    const input: CoreInputDto = {
      websiteId: 1,
      url: 'poolsafety.gov',
      filter: false,
      pageviews: 1,
      visits: 1,
      scanId: '123',
    };

    const result = await service.scan(input);
    expect(result).toMatchObject({
      base: {
        targetUrlBaseDomain: input.url,
      },
      dns: {
        status: ScanStatus.Completed,
      },
      primary: {
        status: ScanStatus.Completed,
      },
      notFound: {
        status: ScanStatus.Completed,
      },
      robotsTxt: {
        status: ScanStatus.Completed,
      },
      sitemapXml: {
        status: ScanStatus.Completed,
      },
    });
  }, E2E_TEST_TIMEOUT);
});
