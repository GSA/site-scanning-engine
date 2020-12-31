import { PaginationResponseDto } from '../pagination-response.dto';
import { WebsiteApiResultDto } from './website-api-result.dto';

export class PaginatedWebsiteResponseDto extends PaginationResponseDto {
  items: WebsiteApiResultDto[];
}
