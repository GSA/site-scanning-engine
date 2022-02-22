import { mock, MockProxy } from 'jest-mock-extended';
import { Browser, Page } from 'puppeteer';
import { Test, TestingModule } from '@nestjs/testing';

import { BrowserService } from './browser.service';
import { PuppeteerPool } from './puppeteer-pool';
import { PUPPETEER_TOKEN } from './puppeteer.service';

describe('BrowserService', () => {
  let service: BrowserService;
  let mockBrowser: MockProxy<Browser>;
  let mockPage: MockProxy<Page>;
  let mockPuppeteerPool: PuppeteerPool;
  const finalUrl = 'https://18f.gsa.gov';

  beforeEach(async () => {
    mockBrowser = mock<Browser>();
    mockPage = mock<Page>();
    mockPuppeteerPool = mock<PuppeteerPool>({
      clear: jest.fn(),
      drain: jest.fn(async () => {}), // eslint-disable-line  @typescript-eslint/no-empty-function
    });

    mockPage.url.calledWith().mockReturnValue(finalUrl);
    mockBrowser.newPage.calledWith().mockResolvedValue(mockPage);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrowserService,
        {
          provide: PUPPETEER_TOKEN,
          useValue: mockPuppeteerPool,
        },
      ],
    }).compile();

    service = module.get<BrowserService>(BrowserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should close the page after scanning', async () => {
    mockBrowser.newPage.calledWith().mockResolvedValue(mockPage);
    await service.processPage(mockBrowser, async () => {}); // eslint-disable-line  @typescript-eslint/no-empty-function
    expect(mockPage.close).toHaveBeenCalled();
  });

  it('closes the browser onModuleDestroy lifecycle event', async () => {
    await service.onModuleDestroy();
    expect(mockPuppeteerPool.drain).toHaveBeenCalled();
    expect(mockPuppeteerPool.clear).toHaveBeenCalled();
  });
});
