import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Website } from 'entities/website.entity';
import { AnalysisService } from './analysis.service';

@Module({
  imports: [TypeOrmModule.forFeature([Website])],
  providers: [AnalysisService],
  exports: [TypeOrmModule, AnalysisService],
})
export class AnalysisModule {}
