import { Injectable } from '@nestjs/common';

@Injectable()
export class DatetimeService {
  now() {
    const now = new Date();
    return now;
  }
}
