import { UswdsScannerModule, UswdsScannerService } from '@app/uswds-scanner';
import { UswdsInputDto } from '@app/uswds-scanner/uswds.input.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { UswdsResult } from 'entities/uswds-result.entity';
import { Website } from 'entities/website.entity';

describe('UswdsScanner (e2e)', () => {
  let service: UswdsScannerService;
  let moduleFixture: TestingModule;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [UswdsScannerModule],
    }).compile();

    service = moduleFixture.get<UswdsScannerService>(UswdsScannerService);
  });

  afterAll(async () => {
    await service.onModuleDestroy();
    await moduleFixture.close();
  });

  it('returns results for a url', async () => {
    const input: UswdsInputDto = {
      websiteId: 1,
      url: '18f.gov',
    };
    const website = new Website();
    website.id = input.websiteId;

    const expected = new UswdsResult();
    expected.website = website;
    expected.usaClasses = 50;
    expected.uswdsString = 1;
    expected.uswdsTables = 0;
    expected.uswdsInlineCss = 0;
    expected.uswdsUsFlag = 20;

    const result = await service.scan(input);
    expect(result).toStrictEqual(expected);
  });
});
