import { Module } from '@nestjs/common';
import { HeadlessController } from './headless.controller';
import { HeadlessService } from './headless.service';

@Module({
  controllers: [HeadlessController],
  providers: [HeadlessService],
})
export class HeadlessModule {}
