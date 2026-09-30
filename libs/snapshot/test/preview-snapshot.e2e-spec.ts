/**
 * preview-snapshot.e2e-spec.ts
 *
 * End-to-end test covering the full scan → entity mapping → serialization →
 * CSV chain for a representative set of domains.
 *
 * What this tests that nothing else does:
 *   - CoreScannerService produces a CoreResultPages object (already covered
 *     by core-scanner/test/app.e2e-spec.ts for statuses only).
 *   - buildCoreResult() maps every page result into a CoreResult (entity
 *     mapping layer, no Postgres required).
 *   - website.serialized() + snapshotColumnOrder + formatValue produce a
 *     well-formed CSV row — same pipeline as csv-serializer.ts and
 *     export-snapshot.ts.
 *   - The 18f.gov redirect/base-domain shape is handled correctly.
 *   - Hidden columns appear when includeHidden=true and are absent otherwise.
 *
 * Deliberately lenient: asserts structural correctness (headers, non-empty
 * key fields), not volatile values like pageTitle or USWDS scores, so the
 * test stays green as site content evolves.
 *
 * Run:
 *   npm run test:e2e -- --testPathPattern preview-snapshot
 */

import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import { BrowserModule } from '@app/browser';
import { CoreScannerModule, CoreScannerService } from '@app/core-scanner';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { CoreResult } from 'entities/core-result.entity';
import { writeToString } from '@fast-csv/format';
import {
  buildCoreResult,
  buildWebsite,
  buildColumnList,
  serializeRow,
  HIDDEN_EXPOSE_NAMES,
} from './scan-to-csv.helper';

// ---------------------------------------------------------------------------
// Domains under test
// ---------------------------------------------------------------------------
// Keep this list small: it drives real network calls.
// 18f.gov: redirects to a different final URL — exercises the redirect path.
// gsa.gov: canonical GSA domain with full USWDS/DAP presence.
// poolsafety.gov: small standalone site, minimal external services.
const PREVIEW_DOMAINS = [
  { url: '18f.gov', label: '18f.gov (redirect)' },
  { url: 'gsa.gov', label: 'gsa.gov (main GSA)' },
  { url: 'poolsafety.gov', label: 'poolsafety.gov (small standalone)' },
];

// Per-scan timeout: live network + Puppeteer can be slow.
const SCAN_TIMEOUT_MS = 90_000;
const SUITE_TIMEOUT_MS = SCAN_TIMEOUT_MS * PREVIEW_DOMAINS.length + 30_000;

describe('Preview snapshot e2e (scan→map→serialize→CSV)', () => {
  let service: CoreScannerService;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [BrowserModule, CoreScannerModule, LoggerModule.forRoot()],
    }).compile();

    service = moduleFixture.get<CoreScannerService>(CoreScannerService);
  }, SUITE_TIMEOUT_MS);

  afterAll(async () => {
    await moduleFixture.close();
  });

  // -------------------------------------------------------------------------
  // 1. Column structure
  // -------------------------------------------------------------------------
  describe('column structure', () => {
    it('buildColumnList() without includeHidden returns exactly snapshotColumnOrder', () => {
      const cols = buildColumnList(false);
      expect(cols).toEqual(CoreResult.snapshotColumnOrder);
    });

    it('buildColumnList() with includeHidden appends hidden columns after public ones', () => {
      const cols = buildColumnList(true);
      const publicLen = CoreResult.snapshotColumnOrder.length;

      // Public section is unchanged
      expect(cols.slice(0, publicLen)).toEqual(CoreResult.snapshotColumnOrder);

      // Hidden columns are present after the public section
      const appended = cols.slice(publicLen);
      for (const name of HIDDEN_EXPOSE_NAMES) {
        if (!CoreResult.snapshotColumnOrder.includes(name)) {
          expect(appended).toContain(name);
        }
      }
    });

    it('secondary_data_dates is absent from public column order', () => {
      expect(CoreResult.snapshotColumnOrder).not.toContain(
        'secondary_data_dates',
      );
    });

    it('secondary_data_dates is present in HIDDEN_EXPOSE_NAMES', () => {
      expect(HIDDEN_EXPOSE_NAMES).toContain('secondary_data_dates');
    });
  });

  // -------------------------------------------------------------------------
  // 2. Per-domain live scans
  // -------------------------------------------------------------------------
  describe.each(PREVIEW_DOMAINS)('$label', ({ url }) => {
    let csvRow: Record<string, unknown>;
    let csvRowHidden: Record<string, unknown>;
    let csvText: string;

    beforeAll(
      async () => {
        const input: CoreInputDto = {
          websiteId: 1,
          url,
          filter: false,
          pageviews: 0,
          visits: 0,
          scanId: `e2e-preview-${url}`,
        };

        const pages = await service.scan(input);
        const coreResult = buildCoreResult(1, url, pages);
        const website = buildWebsite(1, url, coreResult);

        const publicCols = buildColumnList(false);
        const hiddenCols = buildColumnList(true);

        csvRow = serializeRow(website, publicCols, false);
        csvRowHidden = serializeRow(website, hiddenCols, true);

        // Render to actual CSV text to confirm the pipeline produces valid CSV.
        csvText = await writeToString([csvRow], {
          headers: publicCols,
          rowDelimiter: '\r\n',
        });
      },
      SCAN_TIMEOUT_MS,
    );

    // --- structural assertions ---

    it('produces a row with all public snapshot columns as keys', () => {
      const publicCols = buildColumnList(false);
      for (const col of publicCols) {
        expect(csvRow).toHaveProperty(col);
      }
    });

    it('produces valid CSV text containing the header row', () => {
      expect(csvText).toContain('scan_date');
      expect(csvText).toContain('initial_base_domain');
    });

    it('scan_date is a non-empty string', () => {
      expect(typeof csvRow['scan_date']).toBe('string');
      expect((csvRow['scan_date'] as string).length).toBeGreaterThan(0);
    });

    it('initial_base_domain is populated', () => {
      expect(csvRow['initial_base_domain']).toBeTruthy();
    });

    it('primary_scan_status is present', () => {
      expect(csvRow['primary_scan_status']).toBeTruthy();
    });

    // --- hidden column assertions ---

    it('secondary_data_dates column is absent when includeHidden=false', () => {
      expect(Object.keys(csvRow)).not.toContain('secondary_data_dates');
    });

    it('secondary_data_dates column is present when includeHidden=true', () => {
      expect(Object.keys(csvRowHidden)).toContain('secondary_data_dates');
    });

    it('secondary_data_dates value is null or valid JSON with dap and https keys', () => {
      const val = csvRowHidden['secondary_data_dates'];
      if (val === null || val === undefined) {
        // Acceptable: no data freshness dates loaded in local dev
        expect(val == null).toBe(true);
      } else {
        // When present it must be minified JSON {"dap":...,"https":...}
        const parsed = JSON.parse(val as string);
        expect(parsed).toHaveProperty('dap');
        expect(parsed).toHaveProperty('https');
      }
    });

    it('public column order is preserved even when includeHidden=true', () => {
      const hiddenCols = buildColumnList(true);
      const publicCols = buildColumnList(false);
      const hiddenColsPublicSection = hiddenCols.slice(0, publicCols.length);
      expect(hiddenColsPublicSection).toEqual(publicCols);
    });
  });

  // -------------------------------------------------------------------------
  // 3. 18f.gov-specific assertions
  // -------------------------------------------------------------------------
  describe('18f.gov redirect behavior', () => {
    let csvRow: Record<string, unknown>;

    beforeAll(
      async () => {
        const input: CoreInputDto = {
          websiteId: 1,
          url: '18f.gov',
          filter: false,
          pageviews: 0,
          visits: 0,
          scanId: 'e2e-preview-18f',
        };

        const pages = await service.scan(input);
        const coreResult = buildCoreResult(1, '18f.gov', pages);
        const website = buildWebsite(1, '18f.gov', coreResult);
        const cols = buildColumnList(false);
        csvRow = serializeRow(website, cols, false);
      },
      SCAN_TIMEOUT_MS,
    );

    it('initial_base_domain reflects the input URL base domain (18f.gov)', () => {
      // initial_base_domain is derived from the input URL before any redirect,
      // not the redirect target. For input '18f.gov' it will always be '18f.gov'.
      expect(csvRow['initial_base_domain']).toBe('18f.gov');
    });

    it('redirect column is present (may be true or false depending on server config)', () => {
      expect(csvRow).toHaveProperty('redirect');
    });

    it('url column (final URL) is a string or null depending on whether the primary scan completed', () => {
      // finalUrl is page.url() after Puppeteer follows all redirects. It may be
      // null if the primary scan did not complete (e.g. network timeout in CI).
      const val = csvRow['url'];
      expect(val === null || typeof val === 'string').toBe(true);
    });
  });
});
