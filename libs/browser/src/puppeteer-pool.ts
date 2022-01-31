/**
 * This is a modified version of the puppeteer-pool project. puppeteer-pool is
 * itself based on phantom-pool.
 * This version has been modified from a version used by USGS:
 * https://github.com/usgs/wdfn-graph-server/blob/master/src/renderer/puppeteer-pool.js
 */

import * as puppeteer from 'puppeteer';
import * as genericPool from 'generic-pool';

const createValidator = (browser: puppeteer.Browser) => {
  let disconnected = false;
  browser.on('disconnected', () => {
    disconnected = true;
  });
  return () => {
    return !disconnected && browser.process() != null;
  };
};

type Options = {
  max: number;
  min: number;
  idleTimeoutMillis: number;
  maxUses: number;
  testOnBorrow: boolean;
  puppeteerArgs: puppeteer.LaunchOptions &
    puppeteer.BrowserLaunchArgumentOptions &
    puppeteer.BrowserConnectOptions;
};

export const createPuppeteerPool = (userOptions: Partial<Options> = {}) => {
  // Combine `userOptions` with default values.
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

  // `useCounts` keeps track of how many times a given browser instance has been
  // used, so we can destroy it after `maxUses`.
  const useCounts = new WeakMap<puppeteer.Browser, number>();

  // Map of health check validators for each browser.
  const validators = new WeakMap<puppeteer.Browser, () => boolean>();

  // Create a generic pool instance.
  const pool = genericPool.createPool<puppeteer.Browser>(
    {
      create: () => {
        return puppeteer.launch(options.puppeteerArgs).then((browser) => {
          useCounts.set(browser, 0);
          validators.set(browser, createValidator(browser));
          return browser;
        });
      },
      destroy: async (browser) => {
        await browser.close();
        // Fallback - force-kill the process. Should we do this?
        if (browser.process() != null) {
          browser.process().kill('SIGINT');
        }
      },
      validate: async (browser) => {
        const valid = validators.get(browser)();
        const useCount = useCounts.get(browser);
        return valid && (options.maxUses <= 0 || useCount < options.maxUses);
      },
    },
    {
      max: options.max,
      min: options.min,
      idleTimeoutMillis: options.idleTimeoutMillis,
      testOnBorrow: options.testOnBorrow,
    },
  );

  // Wrap generic-pool's acquire function with one that keeps track of the use
  // count of each browser.
  const genericAcquire = pool.acquire.bind(pool);
  pool.acquire = () => {
    return genericAcquire().then((browser: puppeteer.Browser) => {
      const newCount = useCounts.get(browser) + 1;
      useCounts.set(browser, newCount);
      return browser;
    });
  };

  // Create a `use` function that provides a callback/handler interface over
  // `pool.aquire()` and `pool.release()`.
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
