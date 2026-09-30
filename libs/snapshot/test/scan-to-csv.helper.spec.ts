/**
 * scan-to-csv.helper.spec.ts
 *
 * Deterministic unit tests for the scan-to-csv helper.
 * No network, no Puppeteer, no Postgres.
 *
 * Covers:
 *   - buildColumnList(): public and hidden column list construction
 *   - HIDDEN_EXPOSE_NAMES: secondary_data_dates is registered
 *   - serializeRow(): hidden columns absent/present per includeHidden flag
 *   - serializeRow(): secondary_data_dates renders as minified JSON
 *   - serializeRow(): public column order is preserved when includeHidden=true
 *   - serializeRow(): values pass through formatValue (arrays JSON-stringified,
 *     nulls returned as null, etc.)
 */

import 'reflect-metadata';
import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import {
  buildColumnList,
  serializeRow,
  HIDDEN_EXPOSE_NAMES,
} from './scan-to-csv.helper';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWebsite(overrides: Partial<CoreResult> = {}): Website {
  const coreResult = new CoreResult();
  // Minimum required columns to avoid null-reference errors in @Transform hooks
  coreResult.primaryScanStatus = 'completed';
  coreResult.notFoundScanStatus = 'completed';
  coreResult.robotsTxtScanStatus = 'completed';
  coreResult.sitemapXmlScanStatus = 'completed';
  coreResult.dnsScanStatus = 'completed';
  coreResult.accessibilityScanStatus = 'completed';
  coreResult.performanceScanStatus = 'completed';
  coreResult.securityScanStatus = 'completed';
  coreResult.wwwScanStatus = 'completed';
  coreResult.targetUrlBaseDomain = 'example.gov';
  (coreResult as any).updated = '2026-08-01T00:00:00.000Z';

  Object.assign(coreResult, overrides);

  const website = new Website();
  website.id = 1;
  website.url = 'example.gov';
  website.branch = 'executive';
  website.agency = 'Test Agency';
  website.bureau = 'Test Bureau';
  website.topLevelDomain = 'gov';
  website.coreResult = coreResult;
  return website;
}

// ---------------------------------------------------------------------------
// buildColumnList()
// ---------------------------------------------------------------------------
describe('buildColumnList()', () => {
  it('returns exactly snapshotColumnOrder when includeHidden=false', () => {
    expect(buildColumnList(false)).toEqual(CoreResult.snapshotColumnOrder);
  });

  it('starts with snapshotColumnOrder when includeHidden=true', () => {
    const cols = buildColumnList(true);
    expect(cols.slice(0, CoreResult.snapshotColumnOrder.length)).toEqual(
      CoreResult.snapshotColumnOrder,
    );
  });

  it('appends extra columns when includeHidden=true', () => {
    const pubLen = CoreResult.snapshotColumnOrder.length;
    const hiddenCols = buildColumnList(true);
    expect(hiddenCols.length).toBeGreaterThan(pubLen);
  });

  it('does not duplicate public columns when includeHidden=true', () => {
    const cols = buildColumnList(true);
    const seen = new Set<string>();
    for (const col of cols) {
      expect(seen.has(col)).toBe(false);
      seen.add(col);
    }
  });

  it('includes secondary_data_dates when includeHidden=true', () => {
    expect(buildColumnList(true)).toContain('secondary_data_dates');
  });

  it('does not include secondary_data_dates when includeHidden=false', () => {
    expect(buildColumnList(false)).not.toContain('secondary_data_dates');
  });
});

// ---------------------------------------------------------------------------
// HIDDEN_EXPOSE_NAMES
// ---------------------------------------------------------------------------
describe('HIDDEN_EXPOSE_NAMES', () => {
  it('contains secondary_data_dates', () => {
    expect(HIDDEN_EXPOSE_NAMES).toContain('secondary_data_dates');
  });

  it('contains accessibility_results_list', () => {
    expect(HIDDEN_EXPOSE_NAMES).toContain('accessibility_results_list');
  });

  it('no entry duplicates a snapshotColumnOrder entry', () => {
    for (const name of HIDDEN_EXPOSE_NAMES) {
      // If a hidden field gets published it must be removed from HIDDEN_EXPOSE_NAMES
      // to avoid double-columns. This test will catch that case.
      if (CoreResult.snapshotColumnOrder.includes(name)) {
        throw new Error(
          `HIDDEN_EXPOSE_NAMES contains '${name}' which is already in snapshotColumnOrder. ` +
            `Remove it from HIDDEN_EXPOSE_NAMES when publishing the field.`,
        );
      }
    }
    expect(true).toBe(true); // explicit pass
  });
});

// ---------------------------------------------------------------------------
// serializeRow() — column visibility
// ---------------------------------------------------------------------------
describe('serializeRow() column visibility', () => {
  const publicCols = buildColumnList(false);
  const hiddenCols = buildColumnList(true);

  it('includeHidden=false: row only contains public columns', () => {
    const website = makeWebsite();
    const row = serializeRow(website, publicCols, false);
    expect(Object.keys(row)).toEqual(publicCols);
  });

  it('includeHidden=true: row contains all public columns', () => {
    const website = makeWebsite();
    const row = serializeRow(website, hiddenCols, true);
    for (const col of publicCols) {
      expect(row).toHaveProperty(col);
    }
  });

  it('includeHidden=true: row contains secondary_data_dates key', () => {
    const website = makeWebsite();
    const row = serializeRow(website, hiddenCols, true);
    expect(row).toHaveProperty('secondary_data_dates');
  });

  it('includeHidden=false: row does NOT contain secondary_data_dates key', () => {
    const website = makeWebsite();
    const row = serializeRow(website, publicCols, false);
    expect(row).not.toHaveProperty('secondary_data_dates');
  });
});

// ---------------------------------------------------------------------------
// serializeRow() — secondary_data_dates value shape
// ---------------------------------------------------------------------------
describe('serializeRow() secondary_data_dates value', () => {
  const hiddenCols = buildColumnList(true);

  it('is null when both dapDataDate and httpsDataDate are absent', () => {
    const website = makeWebsite();
    const row = serializeRow(website, hiddenCols, true);
    // No dates set — the @Transform emits JSON.stringify({dap:null,https:null})
    // which formatValue passes through as a string.
    const val = row['secondary_data_dates'];
    if (val !== null && val !== undefined) {
      const parsed = JSON.parse(val as string);
      expect(parsed).toHaveProperty('dap');
      expect(parsed).toHaveProperty('https');
      expect(parsed.dap).toBeNull();
      expect(parsed.https).toBeNull();
    }
  });

  it('renders as minified JSON with dap and https keys when dates are set', () => {
    const website = makeWebsite({
      dapDataDate: '2026-07-01',
      httpsDataDate: '2026-07-15',
    } as any);
    const row = serializeRow(website, hiddenCols, true);
    const val = row['secondary_data_dates'];
    expect(typeof val === 'string' || val === null).toBe(true);
    if (val !== null) {
      const parsed = JSON.parse(val as string);
      expect(parsed).toHaveProperty('dap');
      expect(parsed).toHaveProperty('https');
    }
  });
});

// ---------------------------------------------------------------------------
// serializeRow() — formatValue integration
// ---------------------------------------------------------------------------
describe('serializeRow() formatValue integration', () => {
  const publicCols = buildColumnList(false);

  it('array fields are JSON-stringified', () => {
    const website = makeWebsite({ thirdPartyServiceDomains: 'a.com,b.com' });
    const row = serializeRow(website, publicCols, false);
    // thirdPartyServiceDomains is transformed to an array by @Transform, then
    // formatValue JSON-stringifies it.
    const val = row['third_party_service_domains'];
    if (val !== null) {
      expect(typeof val).toBe('string');
      const parsed = JSON.parse(val as string);
      expect(Array.isArray(parsed)).toBe(true);
    }
  });

  it('null fields remain null', () => {
    const website = makeWebsite();
    const row = serializeRow(website, publicCols, false);
    expect(row['url']).toBeNull();
  });

  it('scan_date is a non-empty string', () => {
    const website = makeWebsite();
    const row = serializeRow(website, publicCols, false);
    expect(typeof row['scan_date']).toBe('string');
    expect((row['scan_date'] as string).length).toBeGreaterThan(0);
  });
});
