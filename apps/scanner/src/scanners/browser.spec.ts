import { Test, TestingModule } from '@nestjs/testing';
import { Browser } from 'puppeteer';
import { BrowserFactoryProvider, BROWSER_TOKEN } from './browser.provider';

describe('Browser', () => {
  let provider: Browser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BrowserFactoryProvider],
    }).compile();

    provider = module.get(BROWSER_TOKEN);
  });

  afterEach(async () => {
    provider.close();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
