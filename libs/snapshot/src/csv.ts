import * as _ from 'lodash';
import { Parser, transforms } from 'json2csv';

export const createCsv = (
  rows: { [x: string]: any }[],
  fieldOrder: string[],
) => {
  // Don't allow creating a CSV with columns missing from `fieldOrder` nor extra fields..
  if (rows.length > 0) {
    const headers = new Set(Object.keys(rows[0]));
    const providedHeaders = new Set(fieldOrder);
    if (!_.isEqual(headers, providedHeaders)) {
      const missing = Array.from(headers).filter(
        (x) => !providedHeaders.has(x),
      );
      const extra = Array.from(providedHeaders).filter((x) => !headers.has(x));
      throw new Error(
        `Can't create CSV with missing nor extra fields. <Missing: ${JSON.stringify(
          missing,
        )} Extra: ${JSON.stringify(extra)}`,
      );
    }
  }

  const parser = new Parser({
    fields: fieldOrder,
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
