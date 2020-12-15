import { S3 } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  s3: S3;
  bucketName: string;
  constructor(private configService: ConfigService) {
    this.s3 = new S3({});
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME');
  }

  async upload(fileName: string, body: string) {
    const result = await this.s3.putObject({
      Bucket: this.bucketName,
      Key: fileName,
      Body: body,
    });

    return result;
  }
}
