import { Website } from 'entities/website.entity';

export interface Serializer {
  readonly fileExtension: string;
  serialize(websites: Website[]);
}
