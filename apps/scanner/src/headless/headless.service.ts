import { Injectable } from '@nestjs/common';

@Injectable()
export class HeadlessService {
  startScan(url: string): string {
    return `starting scans for ${url}`;
  }
}
