import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UswdsResult } from 'entities/uswds-result.entity';
import { UswdsResultService } from './uswds-result.service';

@Module({
  imports: [TypeOrmModule.forFeature([UswdsResult])],
  providers: [UswdsResultService],
  exports: [TypeOrmModule],
})
export class UswdsResultModule {}
