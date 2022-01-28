/**
 * This is a modified version of the puppeteer-pool project. puppeteer-pool is
 * itself based on phantom-pool.
 * This version has been modified from a version used by USGS:
 * https://github.com/usgs/wdfn-graph-server/blob/master/src/renderer/puppeteer-pool.js
 */

import * as puppeteer from 'puppeteer';
import * as genericPool from 'generic-pool';

type Options = {
  max: number;
  min: number;
  idleTimeoutMillis: number;
  maxUses: number;
  testOnBorrow: boolean;
  puppeteerArgs: puppeteer.LaunchOptions;
  validator: (browser: puppeteer.Browser) => Promise<boolean>;
};

export const createPuppeteerPool = (userOptions: Partial<Options> = {}) => {
  const options = {
    max: 10,
    // optional. if you set this, make sure to drain() (see step 3)
    min: 2,
    // specifies how long a resource can stay idle in pool before being removed
    idleTimeoutMillis: 30000,
    // specifies the maximum number of times a resource can be reused before being destroyed
    maxUses: 100,
    testOnBorrow: true,
    puppeteerArgs: {
      headless: true,
      args: ['--no-sandbox'],
    },
    validator: () => Promise.resolve(true),
    ...userOptions,
  };
  const useCounts = new WeakMap<puppeteer.Browser, number>();
  const factory = {
    create: () => {
      return puppeteer.launch(options.puppeteerArgs).then((browser) => {
        useCounts.set(browser, 0);
        return browser;
      });
    },
    destroy: async (browser) => {
      browser.close();
    },
    validate: async (browser) => {
      const valid = options.validator(browser);
      const useCount = useCounts.get(browser);
      return valid && (options.maxUses <= 0 || useCount < options.maxUses);
    },
  };
  const config: genericPool.Options = {
    max: options.max,
    min: options.min,
    idleTimeoutMillis: options.idleTimeoutMillis,
    testOnBorrow: options.testOnBorrow,
  };
  const pool = genericPool.createPool<puppeteer.Browser>(factory, config);
  const genericAcquire = pool.acquire.bind(pool);
  pool.acquire = () => {
    return genericAcquire().then((browser: puppeteer.Browser) => {
      const newCount = useCounts.get(browser) + 1;
      useCounts.set(browser, newCount);
      return browser;
    });
  };
  pool.use = (fn) => {
    let resource;
    return pool
      .acquire()
      .then((r) => {
        resource = r;
        return resource;
      })
      .then(fn)
      .then(
        (result) => {
          pool.release(resource);
          return result;
        },
        (err) => {
          pool.release(resource);
          throw err;
        },
      );
  };

  return pool;
};

export type PuppeteerPool = ReturnType<typeof createPuppeteerPool>;
