/**
 * This is a modified version of the puppeteer-pool project. puppeteer-pool is
 * itself based on phantom-pool.
 * This version has been modified from a version used by USGS:
 * https://github.com/usgs/wdfn-graph-server/blob/master/src/renderer/puppeteer-pool.js
 */

import * as genericPool from 'generic-pool';
import { Logger } from 'pino';
import * as puppeteer from 'puppeteer';

const createValidator = (browser: puppeteer.Browser, logger: Logger) => {
  let disconnected = false;
  browser.on('disconnected', () => {
    logger.info({ msg: 'Browser disconnected' });
    disconnected = true;
  });
  return () => {
    const browserProcess = browser.process();
    const valid = !disconnected && browserProcess != null;
    logger.info({
      msg: 'Checked browser health',
      valid,
      disconnected,
      processId: browserProcess?.pid,
    });
    return valid;
  };
};

type Options = {
  max: number;
  min: number;
  idleTimeoutMillis: number;
  maxUses: number;
  testOnBorrow: boolean;
  puppeteerArgs: Parameters<typeof puppeteer.launch>[0];
};

export const createPuppeteerPool = (
  logger: Logger,
  userOptions: Partial<Options> = {},
) => {
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
        logger.info({ msg: 'Creating browser...' });
        return puppeteer.launch(options.puppeteerArgs).then((browser) => {
          useCounts.set(browser, 0);
          validators.set(browser, createValidator(browser, logger));
          return browser;
        });
      },
      destroy: async (browser) => {
        logger.info({ msg: 'Destroying browser...' });
        await browser.close();
        // Fallback - force-kill the process. Should we do this?
        if (browser.process() != null) {
          logger.info({ msg: 'Force killing browser...' });
          browser.process().kill('SIGINT');
        }
      },
      validate: async (browser) => {
        const valid = validators.get(browser)();
        const useCount = useCounts.get(browser);
        const result =
          valid && (options.maxUses <= 0 || useCount < options.maxUses);
        logger.info({ msg: 'Validating browser...', valid, useCount, result });
        return result;
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
    logger.info({ msg: 'Acquiring browser...' });
    return genericAcquire().then((browser: puppeteer.Browser) => {
      const newCount = useCounts.get(browser) + 1;
      useCounts.set(browser, newCount);
      logger.info({ msg: 'Acquired browser...', useCount: newCount });
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
