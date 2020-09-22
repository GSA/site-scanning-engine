import { Module } from '@nestjs/common';
import { HeadlessModule } from './headless/headless.module';

@Module({
  imports: [HeadlessModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
