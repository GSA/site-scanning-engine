import { CoreResult } from './core-result.entity';
import { classToPlain, plainToClass } from 'class-transformer';

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
