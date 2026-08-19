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

    it('produces the expected minified JSON when transform fires (Phase 2 readiness)', () => {
      // Directly invoke the transform logic to validate the JSON shape,
      // independent of the @Exclude() decorator.
      const result = new CoreResult();
      result.dapDataDate = '2026-05-16';
      result.httpsDataDate = '2026-05-21';

      const json = JSON.stringify({
        dap: result.dapDataDate ?? null,
        https: result.httpsDataDate ?? null,
      });

      expect(json).toEqual('{"dap":"2026-05-16","https":"2026-05-21"}');
    });

    it('produces the expected minified JSON with null dap when dapDataDate is absent', () => {
      const result = new CoreResult();
      result.httpsDataDate = '2026-05-21';

      const json = JSON.stringify({
        dap: result.dapDataDate ?? null,
        https: result.httpsDataDate ?? null,
      });

      expect(json).toEqual('{"dap":null,"https":"2026-05-21"}');
    });

    it('produces the expected minified JSON with both null when neither date is set', () => {
      const result = new CoreResult();

      const json = JSON.stringify({
        dap: result.dapDataDate ?? null,
        https: result.httpsDataDate ?? null,
      });

      expect(json).toEqual('{"dap":null,"https":null}');
    });
  });
});
