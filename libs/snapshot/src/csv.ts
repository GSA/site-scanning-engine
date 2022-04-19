import * as _ from 'lodash';
import { json2csv, json2csvAsync } from 'json-2-csv';

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

export const createCsv = async (
  rows: { [x: string]: any }[],
  fieldOrder: string[],
) => {

  const sorter = (columnA, columnB) => {
    if(columnA.indexOf('dap_') !== -1 || columnB.indexOf('dap_') !== -1) {
      if(columnB.indexOf('dap_parameters') !== -1 || columnA.indexOf('dap_parameters') !== -1) {
        if(columnA.indexOf('dap_parameters') !== -1) {
          return columnA.indexOf('dap_parameters') === -1 ? -1 : 1;
        }
        return columnB.indexOf('dap_parameters') === -1 ? 1 : -1;
      } else {
        if(columnA.indexOf('dap_') !== -1) {
          return columnA.indexOf('dap_') === -1 ? -1 : 1;
        }
        return columnB.indexOf('dap_') === -1 ? 1 : -1;
      }
    } else {
      let indexOfA = fieldOrder.indexOf(columnA);
      let indexOfB = fieldOrder.indexOf(columnB);
      return indexOfA > indexOfB ? 1 : -1;
    }
  }

  const csvString = await json2csvAsync(rows, { sortHeader: sorter});
  return csvString
};
