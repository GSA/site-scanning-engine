import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { JsonSerializer } from './json-serializer';

describe('JsonSerializer', () => {
  it('serializes an array containing one website', () => {
    const serializer = new JsonSerializer(CoreResult.snapshotColumnOrder);
    const website = new Website();
    const coreResult = new CoreResult();
    website.coreResult = coreResult;

    const result = serializer.serialize([website]);
    const expectedResult =
      '[{"source_list":null,"login":null,"third_party_service_domains":null,"cookie_domains":null,"required_links_url":null,"required_links_text":null,"robots_txt_sitemap_locations":null}]';

    expect(result).toEqual(expectedResult);
  });
});
