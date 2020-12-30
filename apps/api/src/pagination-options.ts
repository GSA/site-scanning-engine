import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class PaginationOptions {
  @ApiPropertyOptional({
    default: 1,
    minimum: 1,
    type: Number,
    description: 'The page of results to return.',
  })
  @IsNumber()
  @IsPositive()
  page = 1;

  @ApiPropertyOptional({
    default: 10,
    maximum: 100,
    minimum: 0,
    type: Number,
    description: 'The number of items to return per page. Min = 0, Max = 100.',
  })
  @IsNumber()
  @IsPositive()
  limit = 10;
}
