import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { JsonSerializer } from './json-serializer';

describe('JsonSerializer', () => {
  it('serializes an array containing one website', () => {
    const serializer = new JsonSerializer();
    const website = new Website();
    const coreResult = new CoreResult();
    website.coreResult = coreResult;

    const result = serializer.serialize([website]);

    expect(result).toEqual(`[${JSON.stringify(website.serialized())}]`);
  });
});
