import { ScanStatus } from '@app/core-scanner/scan-status';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationOptions } from 'apps/api/src/pagination-options';
import { IsBooleanString, IsIn, IsString, IsUrl } from 'class-validator';

const statuses = Object.values(ScanStatus);

export class FilterWebsiteDto extends PaginationOptions {
  @ApiPropertyOptional({
    type: String,
    description: 'Base Domain of Target URL',
  })
  @IsUrl()
  target_url_domain?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Base Domain of Final URL after any redirects if present.',
  })
  @IsUrl()
  final_url_domain?: string;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Does the Final URL return a 2xx response?',
  })
  @IsBooleanString()
  final_url_live?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Does the Target URL Redirect?',
  })
  @IsBooleanString()
  target_url_redirects?: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Agency Owner of Target URL Base Domain.',
  })
  @IsString()
  target_url_agency_owner?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Bureau Owner of Target URL Base Domain.',
  })
  @IsString()
  target_url_bureau_owner?: string;

  @ApiPropertyOptional({
    enum: statuses,
    description: 'An enum of available scan statuses. ',
  })
  @IsIn(statuses)
  scan_status?: string;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Is DAP detected at the final URL?',
  })
  @IsBooleanString()
  dap_detected_final_url?: boolean;
}
