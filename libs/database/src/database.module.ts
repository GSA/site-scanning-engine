import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreResultModule } from './core-results/core-result.module';
import { WebsiteModule } from './websites/website.module';
import dbconfig from './config/db.config';
import { Website } from 'entities/website.entity';
import { CoreResult } from 'entities/core-result.entity';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { SolutionsResultModule } from './solutions-results/solutions-result.module';

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
      entities: [Website, CoreResult, SolutionsResult],
      synchronize: true,
    };
  },
  inject: [ConfigService],
});

@Module({
  imports: [
    ScannerDatabase,
    WebsiteModule,
    CoreResultModule,
    SolutionsResultModule,
  ],
  providers: [],
  exports: [
    ScannerDatabase,
    WebsiteModule,
    CoreResultModule,
    SolutionsResultModule,
  ],
})
export class DatabaseModule {}
