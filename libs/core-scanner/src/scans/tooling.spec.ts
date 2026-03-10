import { buildToolingResult } from './tooling';
import { browserInstance, newTestPage } from '../test-helper';
import pino from 'pino';

const mockLogger = pino();

describe('tooling scan', () => {
  it('detects Bootstrap via link href', async () => {
    await newTestPage(async ({ page }) => {
      await page.setContent(`
        <html>
          <head>
            <link rel="stylesheet" href="/css/bootstrap.min.css">
          </head>
          <body></body>
        </html>
      `);
      expect(await buildToolingResult(mockLogger, page)).toEqual({
        tooling: 'bootstrap',
      });
    });
  });

  it('detects Bootstrap via characteristic classes', async () => {
    await newTestPage(async ({ page }) => {
      await page.setContent(`
        <html>
          <head></head>
          <body>
            <div class="container-fluid"></div>
          </body>
        </html>
      `);
      expect(await buildToolingResult(mockLogger, page)).toEqual({
        tooling: 'bootstrap',
      });
    });
  });

  it('detects multiple libraries', async () => {
    await newTestPage(async ({ page }) => {
      await page.setContent(`
        <html>
          <head>
            <link rel="stylesheet" href="/css/bootstrap.min.css">
            <link rel="stylesheet" href="/css/animate.min.css">
          </head>
          <body></body>
        </html>
      `);
      expect(await buildToolingResult(mockLogger, page)).toEqual({
        tooling: 'bootstrap,animate.css',
      });
    });
  });

  it('returns null when no libraries are detected', async () => {
    await newTestPage(async ({ page }) => {
      await page.setContent(`
        <html>
          <head></head>
          <body><p>Nothing here</p></body>
        </html>
      `);
      expect(await buildToolingResult(mockLogger, page)).toEqual({
        tooling: null,
      });
    });
  });

  afterAll(async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
  });
});
