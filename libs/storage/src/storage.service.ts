import { LoggerService } from '@app/logger';
import { S3 } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private s3: S3;
  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.s3 = new S3({
      endpoint: this.configService.get<string>('s3.endpoint'),
      credentials: {
        accessKeyId: this.configService.get<string>('s3.accessKeyId'),
        secretAccessKey: this.configService.get<string>('s3.secretAccessKey'),
      },
    });
  }

  async upload(fileName: string, body: string) {
    this.logger.debug('attempting s3 putObject request...');
    try {
      await this.s3.putObject({
        Bucket: this.configService.get<string>('s3.bucketName'),
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
