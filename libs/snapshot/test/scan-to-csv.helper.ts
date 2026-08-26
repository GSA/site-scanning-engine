/**
 * scan-to-csv.helper.ts
 *
 * Shared logic for the no-DB, live-scan preview path:
 *   CoreResultPages → CoreResult → Website → serialized() → CSV row
 *
 * This mirrors exactly what the DB-backed snapshot pipeline does, allowing the
 * full scan→map→serialize chain to be exercised without Postgres or Redis.
 *
 * Used by:
 *   - libs/snapshot/test/preview-snapshot.e2e-spec.ts  (Jest CI gating)
 *   - scripts/export-snapshot.ts --live                (local CSV generation)
 */

import { classToPlain } from 'class-transformer';
import { Logger } from '@nestjs/common';
import { CoreResult, CoreResultPages } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { getHttpsUrl } from '@app/core-scanner/util';
import { formatValue } from '@app/snapshot/serializers/csv-helpers';
import {
  mapPrimary,
  mapNotFound,
  mapRobotsTxt,
  mapSitemapXml,
  mapDns,
  mapAccessibility,
  mapPerformance,
  mapSecurity,
  mapWww,
} from '@app/database/core-results/core-result-mapper';

/**
 * All @Expose()-ed names present on CoreResult that are @Exclude()-ed from the
 * public snapshot. Add a new name here whenever a new hidden field is added.
 *
 * These names are appended after snapshotColumnOrder when --include-hidden is
 * requested, so they never disturb the public column order.
 */
export const HIDDEN_EXPOSE_NAMES: string[] = [
  'secondary_data_dates',
  'accessibility_results_list',
  'dc_date_content',
  'dc_date_created_content',
  'dcterms_created_content',
  'revised_content',
  'last_modified_content',
  'date_content',
];

/**
 * Builds an in-memory CoreResult from a live scan result, replicating the
 * field-mapping logic in CoreResultService without touching Postgres.
 *
 * websiteId is synthetic (used only to satisfy the Website relation shape).
 */
export function buildCoreResult(
  websiteId: number,
  websiteUrl: string,
  pages: CoreResultPages,
  filter: boolean = false,
  pageviews: number = 0,
  visits: number = 0,
): CoreResult {
  const logger = new Logger('scan-to-csv.helper');

  const coreResult = new CoreResult();
  const website = new Website();
  website.id = websiteId;
  coreResult.website = website;
  coreResult.targetUrlBaseDomain = pages.base.targetUrlBaseDomain;
  coreResult.filter = filter;
  coreResult.pageviews = pageviews;
  coreResult.visits = visits;
  coreResult.initialUrl = getHttpsUrl(websiteUrl);

  mapPrimary(coreResult, pages, logger);
  mapNotFound(coreResult, pages, logger);
  mapRobotsTxt(coreResult, pages, logger);
  mapSitemapXml(coreResult, pages, logger);
  mapDns(coreResult, pages, logger);
  mapAccessibility(coreResult, pages, logger);
  mapPerformance(coreResult, pages, logger);
  mapSecurity(coreResult, pages, logger);
  mapWww(coreResult, pages, logger);

  // Set scan_date to now (matches what upsertCoreResult does on update).
  (coreResult as any).updated = new Date().toISOString();

  return coreResult;
}

/**
 * Builds an in-memory Website entity populated with just enough metadata to
 * round-trip through website.serialized().
 */
export function buildWebsite(
  id: number,
  url: string,
  coreResult: CoreResult,
): Website {
  const website = new Website();
  website.id = id;
  website.url = url;
  website.branch = '';
  website.agency = '';
  website.bureau = '';
  website.topLevelDomain = url.split('.').pop() ?? '';
  website.coreResult = coreResult;
  return website;
}

/**
 * Returns the CSV column list to use.
 *
 * includeHidden: append the hidden-field expose names after the public order.
 */
export function buildColumnList(includeHidden: boolean): string[] {
  if (!includeHidden) {
    return CoreResult.snapshotColumnOrder;
  }
  const hidden = HIDDEN_EXPOSE_NAMES.filter(
    (col) => !CoreResult.snapshotColumnOrder.includes(col),
  );
  return [...CoreResult.snapshotColumnOrder, ...hidden];
}

/**
 * Serializes a Website (with its CoreResult) to a flat CSV row object.
 *
 * includeHidden: when true, forces hidden @Exclude()-ed columns to appear by
 * reading them directly from the raw CoreResult (class-transformer excludes
 * them from classToPlain even when HIDDEN_EXPOSE_NAMES requests them).
 */
export function serializeRow(
  website: Website,
  columns: string[],
  includeHidden: boolean,
): Record<string, unknown> {
  // Standard serialization via the same classToPlain pipeline used in
  // production (csv-serializer.ts and export-snapshot.ts).
  const serialized = website.serialized();

  if (includeHidden && website.coreResult) {
    // Manually inject hidden fields that classToPlain strips due to @Exclude().
    // We use classToPlain on just the CoreResult with excludeExtraneousValues
    // disabled so all @Expose()-ed values come through, then pick only the
    // ones that are absent from the standard serialization.
    const rawPlain = classToPlain(website.coreResult, {
      excludeExtraneousValues: false,
    });
    for (const col of HIDDEN_EXPOSE_NAMES) {
      if (!(col in serialized)) {
        // Fall back to the TypeScript property name by checking rawPlain keys
        // (class-transformer uses @Expose names as keys when they are set).
        serialized[col] = rawPlain[col] ?? null;
      }
    }
  }

  const row: Record<string, unknown> = {};
  for (const col of columns) {
    row[col] = formatValue(serialized[col]);
  }
  return row;
}
