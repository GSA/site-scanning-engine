import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, ConfigModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/analysis (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/analysis')
      .set({ 'X-Secret-Api-Access-Token': process.env.API_KEY });
    expect(response.status).toStrictEqual(200);
    expect(response.body.total).toBeDefined();
    expect(response.body.totalAgencies).toBeDefined();
    expect(response.body.totalFinalUrlBaseDomains).toBeDefined();
  });
});
