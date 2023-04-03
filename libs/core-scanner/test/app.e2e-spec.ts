import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';

import { BrowserModule } from '@app/browser';
import { CoreScannerModule, CoreScannerService } from '@app/core-scanner';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { ScanStatus } from 'entities/scan-status';

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

  it('returns results for 18f.gov', async () => {
    const input: CoreInputDto = {
      websiteId: 1,
      url: '18f.gov',
      scanId: '123',
    };

    const result = await service.scan(input);
    expect(result).toMatchObject({
      base: {
        targetUrlBaseDomain: input.url,
      },
      primary: {
        error: null,
        status: ScanStatus.Completed,
      },
      dns: {
        error: null,
        status: ScanStatus.Completed,
      },
      notFound: {
        error: null,
        status: ScanStatus.Completed,
      },
      robotsTxt: {
        error: null,
        status: ScanStatus.Completed,
      },
      sitemapXml: {
        error: null,
        status: ScanStatus.Completed,
      },
    });
  });

  it('returns results for poolsafety.gov', async () => {
    const input: CoreInputDto = {
      websiteId: 1,
      url: 'poolsafety.gov',
      scanId: '123',
    };

    const result = await service.scan(input);
    expect(result).toMatchObject({
      base: {
        targetUrlBaseDomain: input.url,
      },
      dns: {
        error: null,
        status: ScanStatus.Completed,
      },
      primary: {
        error: null,
        status: ScanStatus.Completed,
      },
      notFound: {
        error: null,
        status: ScanStatus.Completed,
      },
      robotsTxt: {
        error: null,
        status: ScanStatus.Completed,
      },
      sitemapXml: {
        error: null,
        status: ScanStatus.Completed,
      },
    });
  });
});
