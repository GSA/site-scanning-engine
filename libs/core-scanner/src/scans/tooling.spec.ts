import { buildToolingResult } from './tooling';
import { browserInstance, newTestPage } from '../test-helper';
import pino from 'pino';

const mockLogger = pino();

describe('tooling scan', () => {
  // ── Existing tests ────────────────────────────────────────────────

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
        tooling: 'animate.css,bootstrap',
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

  // ── Frontend framework detection ──────────────────────────────────

  it('detects Next.js via __NEXT_DATA__ script tag', async () => {
    await newTestPage(async ({ page }) => {
      await page.setContent(`
        <html>
          <head></head>
          <body>
            <script id="__NEXT_DATA__" type="application/json">{"props":{}}</script>
          </body>
        </html>
      `);
      expect(await buildToolingResult(mockLogger, page)).toEqual({
        tooling: 'next.js',
      });
    });
  });

  it('detects Astro via custom elements', async () => {
    await newTestPage(async ({ page }) => {
      await page.setContent(`
        <html>
          <head></head>
          <body>
            <astro-island>content</astro-island>
          </body>
        </html>
      `);
      expect(await buildToolingResult(mockLogger, page)).toEqual({
        tooling: 'astro',
      });
    });
  });

  // ── Frontend library detection (window globals) ───────────────────

  it('detects jQuery via window.jQuery global', async () => {
    await newTestPage(async ({ page }) => {
      await page.setContent(`<html><head></head><body></body></html>`);
      await page.evaluate(() => {
        (window as any).jQuery = { fn: { jquery: '3.7.1' } };
      });
      expect(await buildToolingResult(mockLogger, page)).toEqual({
        tooling: 'jquery',
      });
    });
  });

  it('detects Alpine.js via window.Alpine global', async () => {
    await newTestPage(async ({ page }) => {
      await page.setContent(`<html><head></head><body></body></html>`);
      await page.evaluate(() => {
        (window as any).Alpine = {};
      });
      expect(await buildToolingResult(mockLogger, page)).toEqual({
        tooling: 'alpine.js',
      });
    });
  });

  it('detects Lit via window.litElementVersions global', async () => {
    await newTestPage(async ({ page }) => {
      await page.setContent(`<html><head></head><body></body></html>`);
      await page.evaluate(() => {
        (window as any).litElementVersions = ['3.0.0'];
      });
      expect(await buildToolingResult(mockLogger, page)).toEqual({
        tooling: 'lit',
      });
    });
  });

  // ── Component library detection ───────────────────────────────────

  it('detects MUI via characteristic class names', async () => {
    await newTestPage(async ({ page }) => {
      await page.setContent(`
        <html>
          <head></head>
          <body>
            <button class="MuiButton-root">Click</button>
          </body>
        </html>
      `);
      expect(await buildToolingResult(mockLogger, page)).toEqual({
        tooling: 'mui',
      });
    });
  });

  it('detects Ant Design via link href', async () => {
    await newTestPage(async ({ page }) => {
      await page.setContent(`
        <html>
          <head>
            <link rel="stylesheet" href="/css/antd.min.css">
          </head>
          <body></body>
        </html>
      `);
      expect(await buildToolingResult(mockLogger, page)).toEqual({
        tooling: 'ant-design',
      });
    });
  });

  // ── False-positive regression tests ───────────────────────────────

  it('does not detect Solid from script src containing "consolidate"', async () => {
    await newTestPage(async ({ page }) => {
      await page.setContent(`
        <html>
          <head></head>
          <body>
            <script src="/js/consolidate.js"></script>
          </body>
        </html>
      `);
      expect(await buildToolingResult(mockLogger, page)).toEqual({
        tooling: null,
      });
    });
  });

  it('does not detect Lit from script src containing "split"', async () => {
    await newTestPage(async ({ page }) => {
      await page.setContent(`
        <html>
          <head></head>
          <body>
            <script src="/js/split.js"></script>
          </body>
        </html>
      `);
      expect(await buildToolingResult(mockLogger, page)).toEqual({
        tooling: null,
      });
    });
  });

  it('does not detect Angular from app-root alone', async () => {
    await newTestPage(async ({ page }) => {
      await page.setContent(`
        <html>
          <head></head>
          <body>
            <app-root>My non-Angular app</app-root>
          </body>
        </html>
      `);
      expect(await buildToolingResult(mockLogger, page)).toEqual({
        tooling: null,
      });
    });
  });

  it('does not detect Bulma from .is-primary alone', async () => {
    await newTestPage(async ({ page }) => {
      await page.setContent(`
        <html>
          <head></head>
          <body>
            <button class="is-primary">Click</button>
          </body>
        </html>
      `);
      expect(await buildToolingResult(mockLogger, page)).toEqual({
        tooling: null,
      });
    });
  });

  // ── Regex-based script src detection ──────────────────────────────

  it('detects Solid via properly-patterned script src', async () => {
    await newTestPage(async ({ page }) => {
      await page.setContent(`
        <html>
          <head></head>
          <body>
            <script src="/node_modules/solid-js/dist/solid.js"></script>
          </body>
        </html>
      `);
      expect(await buildToolingResult(mockLogger, page)).toEqual({
        tooling: 'solid',
      });
    });
  });

  it('detects Lit via properly-patterned script src', async () => {
    await newTestPage(async ({ page }) => {
      await page.setContent(`
        <html>
          <head></head>
          <body>
            <script src="/node_modules/lit/index.js"></script>
          </body>
        </html>
      `);
      expect(await buildToolingResult(mockLogger, page)).toEqual({
        tooling: 'lit',
      });
    });
  });

  afterAll(async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
  });
});
