import { LoggerService } from '@app/logger';
import * as AWS from 'aws-sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private s3: AWS.S3;
  private bucket: string;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.s3 = new AWS.S3({
      endpoint: this.configService.get<string>('s3.endpoint'),
      accessKeyId: this.configService.get<string>('s3.accessKeyId'),
      secretAccessKey: this.configService.get<string>('s3.secretAccessKey'),
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
    });

    this.bucket = this.configService.get<string>('s3.bucketName');
    this.logger.setContext(StorageService.name);
  }

  async upload(fileName: string, body: string) {
    this.logger.debug('attempting s3 putObject request...');
    try {
      await this.s3
        .putObject({
          Bucket: this.bucket,
          Key: fileName,
          Body: body,
        })
        .promise();
      this.logger.debug('putObject request completed');
    } catch (error) {
      const err = error as Error;
      this.logger.error(`s3 request failed with: ${err.message}`, err.stack);
    }
  }

  async copy(from: string, to: string) {
    this.logger.debug('attempting s3 copyObject request...');
    try {
      await this.s3
        .copyObject({
          Bucket: this.bucket,
          CopySource: `${this.bucket}/${from}`,
          Key: to,
        })
        .promise();
      this.logger.debug('copyObject request completed');
    } catch (error) {
      const err = error as Error;
      this.logger.error(`s3 request failed with: ${err.message}`, err.stack);
    }
  }

  async exists(objectName: string): Promise<boolean> {
    this.logger.debug(`checking if ${objectName} exists...`);
    try {
      this.s3.headObject({
        Bucket: this.bucket,
        Key: objectName,
      });
      return true;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`s3 request failed with: ${err.message}`, err.stack);
      return false;
    }
  }
}
