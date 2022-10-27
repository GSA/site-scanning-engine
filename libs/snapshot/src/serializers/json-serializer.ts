import { Serializer } from './serializer';
import { Website } from 'entities/website.entity';

export class JsonSerializer implements Serializer {
  get fileExtension() {
    return 'json';
  }

  serialize(websites: Website[]) {
    const serializedResults = websites.map((website) => website.serialized());
    return JSON.stringify(serializedResults);
  }
}
