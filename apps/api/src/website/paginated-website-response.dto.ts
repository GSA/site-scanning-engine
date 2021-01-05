import { PaginationResponseDto } from '../pagination-response.dto';
import { WebsiteApiResultDto } from './website-api-result.dto';

/**
 * `PaginatedWebsiteResponseDto` extends the PaginationResponseDto with an array
 * of WebsiteApiResultDto objects.
 */

export class PaginatedWebsiteResponseDto extends PaginationResponseDto {
  items: WebsiteApiResultDto[];
}
