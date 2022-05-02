import * as _ from 'lodash';
import { Parser } from 'json2csv';
const flatten = require('flat');

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

const flattenRows = (rows: { [x: string]: any }[]) => {
  const allHeaders = new Set<string>();
  const flattenedRows = rows.map((row) => {
    const flattened: { [x: string]: any } = flatten(row, { safe: true });
    Object.keys(flattened).forEach((item) => allHeaders.add(item));
    return flattened;
  });
  return { allHeaders, flattenedRows };
};

const sortOrder = (fieldOrder: string[], flattenedFields: string[]) => {
  const fields = flattenedFields.filter((field) => {
    const split = field.split('.');
    return fieldOrder.includes(split[0]);
  });

  return fields.sort((a, b) => {
    const aSplit = a.split('.');
    const bSplit = b.split('.');
    const aIndex = fieldOrder.indexOf(aSplit[0]);
    const bIndex = fieldOrder.indexOf(bSplit[0]);

    if (aIndex < bIndex) {
      return -1;
    } else if (aIndex > bIndex) {
      return 1;
    } else {
      // aIndex === bIndex
      if (aSplit < bSplit) {
        return -1;
      }
      if (aSplit > bSplit) {
        return 1;
      } else {
        return 0;
      }
    }
  });
};

export const createCsv = (
  rows: { [x: string]: any }[],
  fieldOrder: string[],
) => {
  // Return header row on empty rows array.
  if (rows.length === 0) {
    return fieldOrder.map((f) => `"${f}"`).join(',');
  }

  // Get rows flattened into dot-delimited key names.
  const { allHeaders, flattenedRows } = flattenRows(rows);

  // Sort allHeaders, placing nested attributes after their position in fieldOrder.
  const fields = sortOrder(fieldOrder, Array.from(allHeaders));

  const parser = new Parser({ fields });
  return parser.parse(flattenedRows);
};
