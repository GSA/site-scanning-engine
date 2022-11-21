import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class UrlList {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  private currentFederalSubdomains = this.configService.get<string>(
    'federalSubdomainsUrl',
  );

  async fetch(url?: string): Promise<string> {
    const urlList = url ?? this.currentFederalSubdomains;

    const urls = await this.httpService
      .get(urlList)
      .pipe(map((resp) => resp.data));

    return await lastValueFrom(urls);
  }
}
