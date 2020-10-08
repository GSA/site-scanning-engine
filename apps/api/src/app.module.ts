import { DatabaseModule } from '@app/database';
import { WebsiteService } from '@app/database/websites/websites.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RootController } from './root/root.controller';
import { WebsiteController } from './website/website.controller';

@Module({
  imports: [ConfigModule.forRoot(), DatabaseModule],
  controllers: [WebsiteController, RootController],
  providers: [WebsiteService],
})
export class AppModule {}
