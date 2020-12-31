import { ScanStatus } from '@app/core-scanner/scan-status';
import { PaginationRequestDto } from 'apps/api/src/pagination-options.dto';
import { IsBooleanString, IsIn, IsString, IsUrl } from 'class-validator';

const statuses = Object.values(ScanStatus);

export class FilterWebsiteDto extends PaginationRequestDto {
  @IsUrl()
  target_url_domain?: string;

  @IsUrl()
  final_url_domain?: string;

  @IsBooleanString()
  final_url_live?: boolean;

  @IsBooleanString()
  target_url_redirects?: boolean;

  @IsString()
  target_url_agency_owner?: string;

  @IsString()
  target_url_bureau_owner?: string;

  @IsIn(statuses)
  scan_status?: string;

  @IsBooleanString()
  dap_detected_final_url?: boolean;
}
