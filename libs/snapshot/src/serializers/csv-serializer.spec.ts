import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { CsvSerializer } from './csv-serializer';

const MockWebsite1 = new Website();
MockWebsite1.url = "https://some.url/";

const MockWebsite2 = new Website();
MockWebsite2.url = "https://some.other.url/";

describe('CsvSerializer', () => {
  it('should return a header when no data is passed', () => {
    const serializer = new CsvSerializer(CoreResult.snapshotColumnOrder);

    const result = serializer.serialize([]);

    expect(typeof result).toBe('string');
    expect(result).not.toBe('');
    expect(result).not.toContain('\n');
    expect(result).toContain('"');
  });

  it('should return a header AND data when data is passed', () => {
    const serializer = new CsvSerializer(CoreResult.snapshotColumnOrder);
    const result = serializer.serialize([MockWebsite1]);

    // Sanity Checks
    expect(typeof result).toBe('string');
    expect(result).toContain('\n');

    const lines = result.split('\n');
    expect(lines.length).toBe(2);
  });

  it('should return CSV representing every entity passed in as data', () => {
    const serializer = new CsvSerializer(CoreResult.snapshotColumnOrder);
    const result = serializer.serialize([MockWebsite1, MockWebsite2]);

    // Sanity Checks
    expect(typeof result).toBe('string');
    expect(result).toContain('\n');

    const lines = result.split('\n');
    expect(lines.length).toBe(3);
  });

  it('should serialize websites with DAP parameters as expected', () => {
    const serializer = new CsvSerializer(CoreResult.snapshotColumnOrder);
    const website = new Website();
    const coreResult = new CoreResult();
    coreResult.dapParameters = 'one=test';
    website.coreResult = coreResult;

    const result = serializer.serialize([website]);

    // We know our result of interest will be on the 2nd line
    const lines = result.split('\n');
    const dataLine = lines[1];

    // It will be the only CSV field with data in it, so
    // we can delete all other fields by removing excess commas
    // and the opening and closing " quotes for our target field.
    const parsedData = dataLine
        .replace(/(^,*\"|\",*$)/g, '')

        // Unescape double-double-quotes ;) ("") so that the
        // result is valid JSON.
        .replace(/\"\"/g, '"');

    // Now deserialize the JSON back to and object
    const deserializedData = JSON.parse(parsedData);

    // .. and ensure the value we passed it exists.
    expect(deserializedData.one).toEqual("test");
  });

  it('it should remove newlines from the data', () => {
    const serializer = new CsvSerializer(CoreResult.snapshotColumnOrder);
    const website = new Website();
    website.url = 'more\nthan\none\nline';

    const result = serializer.serialize([website]);

    // Sanity Checks
    expect(typeof result).toBe('string');
    expect(result).toContain('\n');

    const lines = result.split('\n');
    expect(lines.length).toBe(2);
  });

  it('should truncate really long data strings', () => {
    const serializer = new CsvSerializer(CoreResult.snapshotColumnOrder);
    const website = new Website();
    website.url = generateLongString(6000);

    const result = serializer.serialize([website]);

    // Sanity Checks
    expect(typeof result).toBe('string');
    expect(result).toContain('\n');

    const lines = result.split('\n');
    const dataLine = lines[1];

    expect(dataLine.length).toBeGreaterThan(1000);
    expect(dataLine.length).toBeLessThan(6000);
  });
});

function generateLongString(characterLimit: number): string {
  let longString = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  for (let i = 0; i < characterLimit; i++) {
    longString += characters.charAt(
      Math.floor(Math.random() * characters.length),
    );
  }
  return longString;
}
