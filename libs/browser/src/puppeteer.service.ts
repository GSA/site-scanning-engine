import * as puppeteer from 'puppeteer';

/**
 * PUPPETEER_TOKEN provides a lookup token to Nest's DI container.
 */
const PUPPETEER_TOKEN = 'BROWSER';

/**
 * PuppeteerService is an async provider that returns a puppeteer.Browser.
 *
 * @remarks This object should only be used by a Nest.js DI container.
 *
 */
const PuppeteerService = {
  provide: PUPPETEER_TOKEN,

  /**
   * useFactory is an async function that instantiates a headless puppeteer browser.
   *
   * @returns a headless puppeteer.Browser instance.
   */
  useFactory: async () => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'], // :TODO mustfix!
    });
    return browser;
  },
};

export { PUPPETEER_TOKEN, PuppeteerService };
