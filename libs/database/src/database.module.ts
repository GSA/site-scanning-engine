import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
      entities: [Website],
      synchronize: true,
    };
  },
  inject: [ConfigService],
});

@Module({
  imports: [ScannerDatabase, WebsiteModule],
  providers: [],
  exports: [ScannerDatabase, WebsiteModule],
})
export class DatabaseModule {}
