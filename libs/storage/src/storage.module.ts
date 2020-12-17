import { LoggerModule } from '@app/logger';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
