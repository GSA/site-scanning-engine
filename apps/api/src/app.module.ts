import { DatabaseModule } from '@app/database';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebsiteController } from './website/website.controller';

@Module({
  imports: [ConfigModule.forRoot(), DatabaseModule],
  controllers: [WebsiteController],
})
export class AppModule {}
