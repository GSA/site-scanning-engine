import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreResult } from '../../../entities/core-result.entity';
import { CoreResultModule } from './core-results/core-result.module';
import { Website } from '../../../entities/website.entity';
import { WebsiteModule } from './websites/website.module';
import dbconfig from './config/db.config';

const ScannerDatabase = TypeOrmModule.forRootAsync({
  imports: [
    ConfigModule.forRoot({
      load: [dbconfig],
    }),
  ],
  useFactory: (configService: ConfigService) => {
    return {
      type: 'postgres',
      url: configService.get<string>('database.url'),
      entities: [Website, CoreResult],
      synchronize: true, // do not use this in production
      dropSchema: true, // do not use this in production
    };
  },
  inject: [ConfigService],
});

@Module({
  imports: [ScannerDatabase, WebsiteModule, CoreResultModule],
  providers: [],
  exports: [ScannerDatabase, WebsiteModule, CoreResultModule],
})
export class DatabaseModule {}
