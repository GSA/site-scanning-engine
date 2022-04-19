import * as _ from 'lodash';
import { Parser, transforms } from 'json2csv';

// Raise an exception if `orderedFields` is missing or has more fields than `allFields`.
export const ensureAllFields = (
  headers: Set<string>,
  providedHeaders: Set<string>,
) => {
  if (!_.isEqual(headers, providedHeaders)) {
    const missing = Array.from(headers).filter((x) => !providedHeaders.has(x));
    const extra = Array.from(providedHeaders).filter((x) => !headers.has(x));
    throw new Error(
      `Can't create CSV with missing or extra fields. <Missing: ${JSON.stringify(
        missing,
      )} Extra: ${JSON.stringify(extra)}`,
    );
  }
};

export const createCsv = (
  rows: { [x: string]: any }[],
  fieldOrder: string[],
) => {
  const parser = new Parser({
    transforms: [
      transforms.flatten({
        objects: true,
        arrays: false,
        separator: '_',
      }),
    ],
  });

  return parser.parse(rows);
};
