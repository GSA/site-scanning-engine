import { LoggerService } from '@app/logger';
import { S3 } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private s3: S3;
  private bucketName: string;
  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.s3 = new S3({});
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME');
  }

  async upload(fileName: string, body: string) {
    this.logger.debug('attempting s3 putObject request...');
    try {
      await this.s3.putObject({
        Bucket: this.bucketName,
        Key: fileName,
        Body: body,
      });
      this.logger.debug('s3 request completed');
    } catch (error) {
      const err = error as Error;
      this.logger.error(`s3 request failed with: ${err.message}`, err.stack);
    }
  }
}
