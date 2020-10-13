import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreResult } from './core-results/core-result.entity';
import { CoreResultModule } from './core-results/core-result.module';
import { Website } from './websites/website.entity';
import { WebsiteModule } from './websites/website.module';

const ScannerDatabase = TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => {
    return {
      type: 'postgres',
      host: configService.get('DATABASE_HOST'),
      port: +configService.get<number>('DATABASE_PORT'),
      username: configService.get('POSTGRES_USER'),
      password: configService.get('POSTGRES_PASSWORD'),
      entities: [Website, CoreResult],
      synchronize: true,
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
