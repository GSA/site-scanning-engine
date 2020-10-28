import { INestApplicationContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IngestController } from '../src/ingest.controller';
import { AppModule } from './../src/app.module';

describe('IngestController (e2e)', () => {
  let app: INestApplicationContext;
  let ingestController: IngestController;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    ingestController = app.get(IngestController);
  });

  it('writes urls', async () => {
    await ingestController.writeUrls();
  });
});
