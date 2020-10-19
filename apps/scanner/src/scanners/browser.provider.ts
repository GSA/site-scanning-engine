import * as puppeteer from 'puppeteer';

/**
 * BROWSER_TOKEN provides a lookup token to Nest's DI container.
 */
const BROWSER_TOKEN = 'BROWSER';

/**
 * BrowserFactoryProvider is an async provider that returns a puppeteer.Browser.
 *
 * @remarks This object should only be used by a Nest.js DI container.
 *
 * @example
 *
 * ```ts
 * {
 *   imports: [],
 *   providers: [SomeOtherProvider, BrowserFactoryProvider]
 * }
 * ```
 *
 *
 * Use at injection site like this:
 * ```ts
 * class Scanner {
 *   // Note that the Inject decorator needs a `@` prepended to it
 *   // but that currently breaks TSDoc.
 *   constructor(Inject('BROWSER') browser: puppeteer.Browser ) {...}
 * }
 * ```
 */
const BrowserFactoryProvider = {
  /**
   * provide names the token i.e. ('BROWSER') that the DI container uses for lookup.
   */
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

export { BROWSER_TOKEN, BrowserFactoryProvider };
