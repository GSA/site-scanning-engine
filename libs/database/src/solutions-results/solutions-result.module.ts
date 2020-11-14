import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { SolutionsResultService } from './solutions-result.service';

@Module({
  imports: [TypeOrmModule.forFeature([SolutionsResult])],
  providers: [SolutionsResultService],
  exports: [TypeOrmModule, SolutionsResultService],
})
export class SolutionsResultModule {}
