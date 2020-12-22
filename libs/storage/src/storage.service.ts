import { LoggerService } from '@app/logger';
import * as AWS from 'aws-sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private s3: AWS.S3;
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
  }

  async upload(fileName: string, body: string) {
    this.logger.debug('attempting s3 putObject request...');
    try {
      await this.s3
        .putObject({
          Bucket: this.configService.get<string>('s3.bucketName'),
          Key: fileName,
          Body: body,
        })
        .promise();
      this.logger.debug('s3 request completed');
    } catch (error) {
      const err = error as Error;
      this.logger.error(`s3 request failed with: ${err.message}`, err.stack);
    }
  }
}
