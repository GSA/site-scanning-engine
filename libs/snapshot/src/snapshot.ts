import { StorageService } from '@app/storage';
import { Website } from 'entities/website.entity';
import { Serializer } from './serializers/serializer';

export class Snapshot {
  storageService: StorageService;
  serializers: Serializer[];
  websites: Website[];
  priorDate: string;
  fileName: string;

  constructor(
    storageService: StorageService,
    serializers: Serializer[],
    websites: Website[],
    priorDate: string,
    fileName: string,
  ) {
    this.storageService = storageService;
    this.serializers = serializers;
    this.websites = websites;
    this.priorDate = priorDate;
    this.fileName = fileName;
  }

  async archiveDaily(): Promise<void> {
    const operations = [];

    this.serializers.forEach((serializer) => {
      const previousFileName = `${this.fileName.replace('-latest', '-previous')}.${serializer.fileExtension}`;
      const archiveFileName = `archive/${serializer.fileExtension}/${this.fileName.replace('-latest', '')}-${this.priorDate}.${serializer.fileExtension}`;
      operations.push(
        this.storageService.copy(previousFileName, archiveFileName),
        this.storageService.copy(
          `${this.fileName}.${serializer.fileExtension}`,
          previousFileName,
        ),
      );
    });

    await Promise.all(operations);
  }

  async saveNew(): Promise<void> {
    for (const serializer of this.serializers) {
      let serializedData = serializer.serialize(this.websites);

      await this.storageService.upload(
        `${this.fileName}.${serializer.fileExtension}`,
        serializedData,
      );

      serializedData = null;
    }
  }
}
