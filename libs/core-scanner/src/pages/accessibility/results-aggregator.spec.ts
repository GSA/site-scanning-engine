import { promises as fs } from 'fs';
import { join } from 'path';
import { Result } from 'axe-core';
import { aggregateResults } from './results-aggregator';

async function readJsonFile(filePath) {
  try {
    const jsonString = await fs.readFile(filePath, 'utf8');
    const jsonObject = JSON.parse(jsonString);
    return jsonObject;
  } catch (error) {
    console.error('Error reading the file:', error);
  }
}

describe('aggregateResults', () => {
  it('should aggregate results from a list of one result', async () => {
    const results: Result[] = await readJsonFile(
      join(__dirname, './test-fixtures/results1Raw.json'),
    );

    const result = aggregateResults(results);

    const expectedResult = await readJsonFile(
      join(__dirname, './test-fixtures/results1Expected.json'),
    );

    expect(result).toEqual(expectedResult);
  });

  it('should aggregate results from a list of two results', async () => {
    const results: Result[] = await readJsonFile(
      join(__dirname, './test-fixtures/results2Raw.json'),
    );

    const result = aggregateResults(results);

    const expectedResult = await readJsonFile(
      join(__dirname, './test-fixtures/results2Expected.json'),
    );

    expect(result).toEqual(expectedResult);
  });
});
