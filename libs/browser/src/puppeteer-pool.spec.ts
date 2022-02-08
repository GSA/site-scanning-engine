import { Pool } from 'generic-pool';
import { mock } from 'jest-mock-extended';
import { Logger } from 'pino';
import { Browser } from 'puppeteer';

import { createPuppeteerPool, PuppeteerPool } from './puppeteer-pool';

describe('Puppeteer pool', () => {
  let pool: PuppeteerPool;

  const inUseCount = ({ size, available }: Pool<Browser>) => {
    return size - available;
  };

  beforeEach(() => {
    pool = createPuppeteerPool(mock<Logger>(), {
      min: 0,
      max: 2,
    });
  });

  afterEach(async () => {
    await pool.drain();
    await pool.clear();
  });

  it('create pool', async () => {
    const instance = await pool.acquire();
    const page = await instance.newPage();
    const viewportSize = await page.viewport();
    expect(viewportSize.width).toEqual(800);
    expect(viewportSize.height).toEqual(600);

    await pool.release(instance);
  });

  it('use', async () => {
    expect(inUseCount(pool)).toEqual(0);
    const result = await pool.use(async (instance) => {
      expect(inUseCount(pool)).toEqual(1);
      const page = await instance.newPage();
      return await page.evaluate('navigator.userAgent');
    });
    expect(result).not.toBe(null);
    expect(inUseCount(pool)).toEqual(0);
  });

  it('use and throw', async () => {
    expect(inUseCount(pool)).toEqual(0);
    await expect(
      pool.use(async () => {
        expect(inUseCount(pool)).toEqual(1);
        throw new Error('some err');
      }),
    ).rejects.toThrow('some err');
    expect(inUseCount(pool)).toEqual(0);
  });
});
