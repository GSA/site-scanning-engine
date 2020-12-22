import { Module } from '@nestjs/common';
import { DatetimeService } from './datetime.service';

@Module({
  providers: [DatetimeService],
  exports: [DatetimeService],
})
export class DatetimeModule {}
