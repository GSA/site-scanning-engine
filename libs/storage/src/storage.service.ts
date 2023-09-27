import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  CopyObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  private s3client: S3Client;
  private bucket: string;
  private logger = new Logger(StorageService.name);

  constructor(private configService: ConfigService) {
    this.s3client = new S3Client({
      endpoint: this.configService.get<string>('s3.endpoint'),
      region: this.configService.get<string>('s3.region'),
      credentials: {
        accessKeyId: this.configService.get<string>('s3.accessKeyId'),
        secretAccessKey: this.configService.get<string>('s3.secretAccessKey'),
      },
      forcePathStyle: true,
    });

    this.bucket = this.configService.get<string>('s3.bucketName');
  }

  async upload(fileName: string, body: string) {
    this.logger.debug('attempting s3 putObject request...');
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        Body: body,
      });
      await this.s3client.send(command);
      this.logger.debug('putObject request completed');
    } catch (error) {
      const err = error as Error;
      this.logger.error(`s3 request failed with: ${err.message}`, err.stack);
    }
  }

  async copy(from: string, to: string) {
    this.logger.debug('attempting s3 copyObject request...');
    try {
      const command = new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${from}`,
        Key: to,
      });
      await this.s3client.send(command);
      this.logger.debug('copyObject request completed');
    } catch (error) {
      const err = error as Error;
      this.logger.error(`s3 request failed with: ${err.message}`, err.stack);
    }
  }

  async exists(objectName: string): Promise<boolean> {
    this.logger.debug(`checking if ${objectName} exists...`);
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: objectName,
      });
      await this.s3client.send(command);
      return true;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`s3 request failed with: ${err.message}`, err.stack);
      return false;
    }
  }
}
