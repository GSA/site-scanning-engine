import * as puppeteer from 'puppeteer';

/**
 * BROWSER_TOKEN provides a lookup token to Nest's DI container.
 */
const BROWSER_TOKEN = 'BROWSER';

/**
 * BrowserService is an async provider that returns a puppeteer.Browser.
 *
 * @remarks This object should only be used by a Nest.js DI container.
 *
 */
const BrowserService = {
  provide: BROWSER_TOKEN,

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

export { BROWSER_TOKEN, BrowserService };
