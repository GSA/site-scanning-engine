import { CoreResult } from './core-result.entity';
import { plainToClass } from 'class-transformer';

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
});
