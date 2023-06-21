import { Serializer } from './serializer';
import { Website } from 'entities/website.entity';
import { Parser } from 'json2csv';

export class CsvSerializer implements Serializer {
  columnOrder: string[];

  constructor(columnOrder = []) {
    this.columnOrder = columnOrder;
  }

  get fileExtension() {
    return 'csv';
  }

  serialize(websites: Website[]) {
    const serializedResults = websites.map((website) => website.serialized());

    const cleanResults = serializedResults.map((result) => {
      const cleanResult = {};
      for (const key in result) {
        if (typeof result[key] === 'string') {
          cleanResult[key] = result[key].replace(/\r?\n|\r/g, '');
        } else {
          cleanResult[key] = result[key];
        }
      }
      return cleanResult;
    });

    return this.createCsv(cleanResults);
  }

  createCsv(rows: { [x: string]: any }[]) {
    // Return header row on empty rows array.
    if (rows.length === 0) {
      return this.columnOrder.map((f) => `"${f}"`).join(',');
    }

    const fields = this.sortOrder(
      this.columnOrder,
      Array.from(Object.keys(rows[0])),
    );
    const eol = '\r\n';
    const parser = new Parser({ fields, eol });

    return parser.parse(rows);
  }

  private sortOrder(fieldOrder: string[], flattenedFields: string[]) {
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
        if (a < b) {
          return -1;
        } else if (a > b) {
          return 1;
        } else {
          return 0;
        }
      }
    });
  }
}
