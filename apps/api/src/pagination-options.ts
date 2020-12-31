import { IsNumber, IsOptional, IsPositive, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 *  PaginationRequestDto describes the pagination request schema for the API.
 *
 *  This is designed to be used with other DTOs through extension.
 * ```ts
 * class WebsiteDto extends PaginationRequestDto {}
 * ```
 * ```
 */
export class PaginationRequestDto {
  /**
   * page denotes the page number of the results to display. The default value and the
   * minimum value are 1.
   *
   * page works in conjunction with the limit parameter. For example, if there are
   * 1000 results, and a limit of 10, there would be 100 pages. A value of page=2
   * would show you the second page (results 10-19 in a zero-index system).
   *
   * @example websites/?page=2
   *
   */
  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Min(1)
  @Transform((value) => Number(value))
  page? = 1;

  /**
   * limit denotes the number of items that will be returned from the API in the `items` array.
   * The default value is 10. The maximum is 100.
   *
   * @example /websites/?limit=10
   */
  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Max(100)
  @Transform((value) => Number(value))
  limit? = 10;
}
