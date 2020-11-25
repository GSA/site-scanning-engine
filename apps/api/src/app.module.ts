import { DatabaseModule } from '@app/database';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RootController } from './root/root.controller';
import { WebsiteController } from './website/website.controller';

@Module({
  imports: [ConfigModule.forRoot(), DatabaseModule],
  controllers: [WebsiteController, RootController],
})
export class AppModule {}
