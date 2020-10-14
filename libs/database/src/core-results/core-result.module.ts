import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreResult } from './core-result.entity';
import { CoreResultService } from './core-result.service';

@Module({
  imports: [TypeOrmModule.forFeature([CoreResult])],
  providers: [CoreResultService],
  exports: [TypeOrmModule],
})
export class CoreResultModule {}
