import { Serializer } from './serializer';
import { Website } from 'entities/website.entity';
import { writeToBuffer } from '@fast-csv/format';
import { formatValue } from './csv-helpers';

export class CsvSerializer implements Serializer {
  columnOrder: string[];

  constructor(columnOrder = []) {
    this.columnOrder = columnOrder;
  }

  get fileExtension() {
    return 'csv';
  }

  async serialize(websites: Website[]) {
    const serializedWebsites = websites
      .map((website) => website.serialized())
      .map((serializedWebsite) => {
        const extractedData: any = {};
        this.columnOrder.forEach((column) => {
          extractedData[column] = serializedWebsite[column];
        });
        return extractedData;
      });

    const formattedResults = this.formatWebsites(serializedWebsites);

    return this.createCsv(formattedResults);
  }

  private async createCsv(rows: { [x: string]: any }[]) {
    if (rows.length === 0) {
      return this.columnOrder.map((f) => `"${f}"`).join(',');
    }

    const fields = this.sortOrder(
      this.columnOrder,
      Array.from(Object.keys(rows[0])),
    );

    const buffer = await writeToBuffer(rows, {
      headers: fields,
      rowDelimiter: '\r\n',
    });

    return buffer.toString();
  }

  private formatWebsites(websites) {
    return websites.map((result) => {
      const formattedResult = {};
      for (const key in result) {
        formattedResult[key] = formatValue(result[key]);
      }
      return formattedResult;
    });
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
