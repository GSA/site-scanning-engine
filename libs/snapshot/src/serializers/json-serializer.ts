import { Serializer } from './serializer';
import { Website } from 'entities/website.entity';

export class JsonSerializer implements Serializer {
  columnOrder: string[];

  constructor(columnOrder = []) {
    this.columnOrder = columnOrder;
  }

  get fileExtension() {
    return 'json';
  }

  serialize(websites: Website[]) {
    const serializedWebsites = websites
      .map((website) => website.serialized())
      .map((serializedWebsite) => {
        const extractedData: any = {};
        this.columnOrder.forEach((column) => {
          extractedData[column] = serializedWebsite[column];
        });
        return extractedData;
      });
    return JSON.stringify(serializedWebsites);
  }
}
