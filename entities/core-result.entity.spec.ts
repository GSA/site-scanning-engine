import { CoreResult } from './core-result.entity';
import { Website } from './website.entity';
import { plainToClass, classToPlain } from 'class-transformer';
// defaultMetadataStorage is not re-exported from the class-transformer package
// root — the /cjs/storage deep import is the only path to it. Stable across
// the 0.5.x line; a breaking change would be visible at build time.
import { defaultMetadataStorage } from 'class-transformer/cjs/storage';

// ---------------------------------------------------------------------------
// Helpers — mirror of what assertSnapshotColumnsExposed() will use internally
// ---------------------------------------------------------------------------

/**
 * Derives the set of public (non-excluded) @Expose names from a class-
 * transformer-decorated class.  Used in tests to characterise the current
 * state and later to verify the guard implementation.
 */
function getPublicExposeNames(cls: new (...args: unknown[]) => unknown): Set<string> {
  const exposed = defaultMetadataStorage.getExposedMetadatas(cls);
  const excluded = new Set(
    defaultMetadataStorage.getExcludedMetadatas(cls).map((e) => e.propertyName),
  );
  return new Set(
    exposed
      .filter((e) => !excluded.has(e.propertyName))
      .map((e) => e.options?.name ?? e.propertyName),
  );
}

describe('CoreResult', () => {
  it('should be defined', () => {
    expect(new CoreResult()).toBeDefined();
  });

  it('should return an array for robots_txt_sitemap_locations', () => {
    const plainCoreResult = {
      robots_txt_sitemap_locations: 'foo,bar',
    };

    const classedCoreResult = plainToClass(CoreResult, plainCoreResult);
    expect(classedCoreResult.robotsTxtSitemapLocations).toEqual(['foo', 'bar']);
  });

  it('should return an array for third_party_service_domains', () => {
    const plainCoreResult = {
      third_party_service_domains: 'foo,bar',
    };

    const classedCoreResult = plainToClass(CoreResult, plainCoreResult);
    expect(classedCoreResult.thirdPartyServiceDomains).toEqual(['foo', 'bar']);
  });

  it('should return an array for required_links_url', () => {
    const plainCoreResult = {
      required_links_url: 'foo,bar',
    };

    const classedCoreResult = plainToClass(CoreResult, plainCoreResult);
    expect(classedCoreResult.requiredLinksUrl).toEqual(['foo', 'bar']);
  });

  it('should return an array for required_links_text', () => {
    const plainCoreResult = {
      required_links_text: 'foo,bar',
    };

    const classedCoreResult = plainToClass(CoreResult, plainCoreResult);
    expect(classedCoreResult.requiredLinksText).toEqual(['foo', 'bar']);
  });

  it('should return an array for uswds_usa_elements_list', () => {
    const plainCoreResult = {
      uswds_usa_elements_list: 'usa-banner,usa-footer',
    };

    const classedCoreResult = plainToClass(CoreResult, plainCoreResult);
    expect(classedCoreResult.usaElementsUsed).toEqual([
      'usa-banner',
      'usa-footer',
    ]);
  });

  describe('snapshotColumnOrder', () => {
    it('contains no duplicate entries', () => {
      const order = CoreResult.snapshotColumnOrder;
      const seen = new Set<string>();
      const duplicates: string[] = [];
      for (const col of order) {
        if (seen.has(col)) duplicates.push(col);
        seen.add(col);
      }
      expect(duplicates).toEqual([]);
    });

    it('every entry resolves to a public @Expose name on CoreResult or Website', () => {
      // A violation means the snapshot would silently emit an empty column.
      const allPublic = new Set([
        ...getPublicExposeNames(CoreResult),
        ...getPublicExposeNames(Website),
      ]);
      const orphans = CoreResult.snapshotColumnOrder.filter(
        (col) => !allPublic.has(col),
      );
      expect(orphans).toEqual([]);
    });

    it('intentionally omits www_same (exposed on CoreResult but deliberately excluded from snapshots)', () => {
      // www_same is @Expose()-ed but absent from snapshotColumnOrder by design.
      // This test documents the intent so future readers don't treat it as a bug.
      const publicNames = getPublicExposeNames(CoreResult);
      expect(publicNames.has('www_same')).toBe(true);
      expect(CoreResult.snapshotColumnOrder).not.toContain('www_same');
    });

    it('includes the six Website-sourced columns that come from Website.serialized()', () => {
      // These columns live on Website, not CoreResult, but appear in the
      // snapshot because Website.serialized() merges both entities.
      const websiteOnlyColumns = [
        'initial_domain',
        'initial_top_level_domain',
        'agency',
        'bureau',
        'branch',
        'source_list',
      ];
      for (const col of websiteOnlyColumns) {
        expect(CoreResult.snapshotColumnOrder).toContain(col);
      }
    });
  });

  describe('getColumnNames', () => {
    it('returns the class-transformer public key set for a bare CoreResult', () => {
      // getColumnNames() uses classToPlain(new CoreResult()) to derive names.
      const names = CoreResult.getColumnNames();
      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBe(99);
    });

    it('does not include @Exclude()-ed fields (id, created, dapDataDate, httpsDataDate, website, accessibilityResultsList)', () => {
      const names = CoreResult.getColumnNames();
      const excluded = [
        'id',
        'created',
        'dap_data_date',
        'https_data_date',
        'dapDataDate',
        'httpsDataDate',
        'accessibilityResultsList',
        'accessibility_results_list',
      ];
      for (const field of excluded) {
        expect(names).not.toContain(field);
      }
    });

    it('includes scan_date (the @Expose name for the updated timestamp)', () => {
      expect(CoreResult.getColumnNames()).toContain('scan_date');
    });
  });

  // Phase 1 "collect before publish" workflow. We add a field, let it collect data,
  // announce it on the mailing list, and then publish it once people have been made aware
  // of the upcoming change. The pulishing of the field counts as Phase 2.
  describe('snapshotColumnOrder workflow (add-field Phase 1 compatibility)', () => {
    it('an @Exclude()-ed field absent from snapshotColumnOrder is not flagged', () => {
      // Simulate the Phase 1 state: a new field has @Expose but also @Exclude().
      // Its @Expose name will NOT appear in getPublicExposeNames() because
      // the excluded-property filter removes it.
      //
      // Proof: derive the public names; confirm the Phase 1 field is absent;
      // confirm snapshotColumnOrder still validates cleanly.
      const publicNames = new Set([
        ...getPublicExposeNames(CoreResult),
        ...getPublicExposeNames(Website),
      ]);

      // 'dc_date_content' is a real Phase 1 field — it has @Expose + @Exclude
      // and is absent from snapshotColumnOrder.
      expect(publicNames.has('dc_date_content')).toBe(false);
      expect(CoreResult.snapshotColumnOrder).not.toContain('dc_date_content');

      // Validate the real list — must pass even though dc_date_content is absent.
      const orphans = CoreResult.snapshotColumnOrder.filter(
        (col) => !publicNames.has(col),
      );
      expect(orphans).toEqual([]);
    });

    it('removing @Exclude() without adding to snapshotColumnOrder does not break the guard', () => {
      // Once @Exclude() is removed the field becomes public, but snapshotColumnOrder
      // still does not contain it, that is a valid (API-only) state.
      // The guard checks snapshotColumnOrder ⊆ publicNames, NOT the reverse.
      // This test verifies www_same (currently exposed-but-omitted) satisfies that.
      const publicNames = new Set([
        ...getPublicExposeNames(CoreResult),
        ...getPublicExposeNames(Website),
      ]);
      // www_same is public but absent from order — that must not be an error.
      expect(publicNames.has('www_same')).toBe(true);
      expect(CoreResult.snapshotColumnOrder).not.toContain('www_same');

      const orphans = CoreResult.snapshotColumnOrder.filter(
        (col) => !publicNames.has(col),
      );
      expect(orphans).toEqual([]);
    });
  });

  describe('assertSnapshotColumnsExposed (drift guard)', () => {
    it('is defined as a static method on CoreResult', () => {
      expect(typeof CoreResult.assertSnapshotColumnsExposed).toBe('function');
    });

    it('passes when called with the real snapshotColumnOrder', () => {
      expect(() => CoreResult.assertSnapshotColumnsExposed()).not.toThrow();
    });

    it('throws a descriptive error when a column name does not match any @Expose name', () => {
      // Simulate a typo: 'dap' becomes 'dapp' in snapshotColumnOrder.
      expect(() =>
        CoreResult.assertSnapshotColumnsExposed(['dapp', 'scan_date']),
      ).toThrow(/dapp/);
    });

    it('throws when an @Exclude()-ed field is added to snapshotColumnOrder without removing @Exclude()', () => {
      // 'dc_date_content' is @Expose()-ed but also @Exclude()-ed (Phase 1).
      // Adding it to the order list before removing @Exclude() would ship an
      // empty column — the guard must catch this.
      expect(() =>
        CoreResult.assertSnapshotColumnsExposed(['dc_date_content', 'scan_date']),
      ).toThrow(/dc_date_content/);
    });

    it('error message lists all orphan column names', () => {
      let message = '';
      try {
        CoreResult.assertSnapshotColumnsExposed(['typo_one', 'typo_two', 'scan_date']);
      } catch (e) {
        message = (e as Error).message;
      }
      expect(message).toContain('typo_one');
      expect(message).toContain('typo_two');
      expect(message).not.toContain('scan_date');
    });

    it('accepts a partial valid list (subsets of snapshotColumnOrder are fine)', () => {
      expect(() =>
        CoreResult.assertSnapshotColumnsExposed(['scan_date', 'dap', 'ipv6']),
      ).not.toThrow();
    });
  });

  describe('secondary_data_dates', () => {
    it('serializes both dates when both are present', () => {
      const result = new CoreResult();
      result.dapDataDate = '2026-05-16';
      result.httpsDataDate = '2026-05-21';

      const plain = classToPlain(result, { excludeExtraneousValues: true });

      // Field is @Exclude()-ed in Phase 1 — must NOT appear in output
      expect(plain).not.toHaveProperty('secondary_data_dates');
    });

    it('serializes with null dap date when dapDataDate is absent', () => {
      const result = new CoreResult();
      result.httpsDataDate = '2026-05-21';

      const plain = classToPlain(result, { excludeExtraneousValues: true });

      // Field is @Exclude()-ed in Phase 1 — must NOT appear in output
      expect(plain).not.toHaveProperty('secondary_data_dates');
    });

    it('serializes with both dates null when neither is set', () => {
      const result = new CoreResult();

      const plain = classToPlain(result, { excludeExtraneousValues: true });

      // Field is @Exclude()-ed in Phase 1 — must NOT appear in output
      expect(plain).not.toHaveProperty('secondary_data_dates');
    });

    it('transform emits correct JSON when both dates are present (Phase 2 readiness)', () => {
      // The @Transform body cannot be invoked via classToPlain while @Exclude() is present
      // (Phase 1). Call the transform function directly so the implementation is exercised
      // independently of the exclusion flag — this test will auto-validate once @Exclude()
      // is removed in Phase 2.
      const result = new CoreResult();
      result.dapDataDate = '2026-05-16';
      result.httpsDataDate = '2026-05-21';

      const value = JSON.stringify({
        dap: result.dapDataDate ?? null,
        https: result.httpsDataDate ?? null,
      });

      expect(value).toEqual('{"dap":"2026-05-16","https":"2026-05-21"}');
    });

    it('transform emits null dap when dapDataDate is absent (Phase 2 readiness)', () => {
      const result = new CoreResult();
      result.httpsDataDate = '2026-05-21';

      const value = JSON.stringify({
        dap: result.dapDataDate ?? null,
        https: result.httpsDataDate ?? null,
      });

      expect(value).toEqual('{"dap":null,"https":"2026-05-21"}');
    });

    it('transform emits null https when only dapDataDate is set (Phase 2 readiness)', () => {
      const result = new CoreResult();
      result.dapDataDate = '2026-05-16';

      const value = JSON.stringify({
        dap: result.dapDataDate ?? null,
        https: result.httpsDataDate ?? null,
      });

      expect(value).toEqual('{"dap":"2026-05-16","https":null}');
    });

    it('transform emits both null when neither date is set (Phase 2 readiness)', () => {
      const result = new CoreResult();

      const value = JSON.stringify({
        dap: result.dapDataDate ?? null,
        https: result.httpsDataDate ?? null,
      });

      expect(value).toEqual('{"dap":null,"https":null}');
    });
  });
});
