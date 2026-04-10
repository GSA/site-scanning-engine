import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Website } from 'entities/website.entity';
import { QueueModule } from '@app/queue';
import { AnalysisService } from './analysis.service';

@Module({
  imports: [TypeOrmModule.forFeature([Website]), QueueModule],
  providers: [AnalysisService],
  exports: [TypeOrmModule, AnalysisService],
})
export class AnalysisModule {}
