import { ScanStatus } from '@app/core-scanner/scan-status';
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

function parseBrowserError(err: Error) {
  const dnsError = err.message.startsWith('net::ERR_NAME_NOT_RESOLVED');
  const timeoutError = err.name === 'TimeoutError';
  const sslError = err.message.startsWith('net::ERR_CERT_COMMON_NAME_INVALID');

  let errorType: ScanStatus;

  if (timeoutError) {
    errorType = ScanStatus.Timeout;
  } else if (dnsError) {
    errorType = ScanStatus.DNSResolutionError;
  } else if (sslError) {
    errorType = ScanStatus.InvalidSSLCert;
  } else {
    errorType = ScanStatus.UnknownError;
  }

  return errorType;
}

export { BROWSER_TOKEN, BrowserService, parseBrowserError };
