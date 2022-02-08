import { PinoLogger } from 'nestjs-pino';
import { createPuppeteerPool } from './puppeteer-pool';

/**
 * PUPPETEER_TOKEN provides a lookup token to Nest's DI container.
 */
export const PUPPETEER_TOKEN = 'BROWSER';

/**
 * PuppeteerService is an async provider that returns a puppeteer.Browser.
 *
 * @remarks This object should only be used by a Nest.js DI container.
 *
 */
export const PuppeteerService = {
  provide: PUPPETEER_TOKEN,

  inject: [PinoLogger],

  /**
   * useFactory is an async function that instantiates a headless puppeteer browser.
   *
   * @returns a headless puppeteer.Browser instance.
   */
  useFactory: async (logger: PinoLogger) => {
    return createPuppeteerPool(
      logger.logger.child({ context: 'puppeteer-pool' }),
      {
        min: 0,
        max: 4,

        // How long a resource can stay idle in pool before being removed
        idleTimeoutMillis: 60000,

        // Maximum number of times an individual resource can be reused before being
        // destroyed; set to 0 to disable
        maxUses: 100,

        // Validate resource before borrowing; required for `maxUses and `validator`
        testOnBorrow: true,

        // Arguments to pass on to Puppeteer
        puppeteerArgs: {
          args: ['--no-sandbox'],
        },
      },
    );
  },
};

export type PuppeteerPool = ReturnType<typeof createPuppeteerPool>;
