import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreResult } from 'entities/core-result.entity';
import { CoreResultService } from './core-result.service';

@Module({
  imports: [TypeOrmModule.forFeature([CoreResult])],
  providers: [CoreResultService],
  exports: [TypeOrmModule, CoreResultService],
})
export class CoreResultModule {}
