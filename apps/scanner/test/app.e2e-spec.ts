import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { ScanEngineModule } from '../src/scan-engine/scan-engine.module';
import { ScanEngineController } from '../src/scan-engine/scan-engine.controller';
import { ResultCoreDto } from '../src/scanners/core/result-core.dto.interface';
import { InputCoreDto } from '../src/scanners/core/input-core.dto';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('to be defined', () => {
    const controller = app.select(ScanEngineModule).get(ScanEngineController);
    expect(controller).toBeDefined();
  });

  it('the controller to return the correct result', async () => {
    const controller = app.select(ScanEngineModule).get(ScanEngineController);

    const input: InputCoreDto = {
      url: 'https://18f.gov',
      agency: 'GSA',
      branch: 'Executive',
    };

    const expected: ResultCoreDto = {
      targetUrl: input.url,
      agency: input.agency,
      branch: input.branch,
      finalUrl: 'https://18f.gsa.gov/',
    };

    const result = await controller.runCoreScanner(input);
    expect(result).toStrictEqual(expected);
  });
});
