import { IsBooleanString, IsUrl } from 'class-validator';

export class FilterWebsiteDto {
  @IsUrl()
  target_url_domain?: string;

  @IsUrl()
  final_url_domain?: string;

  @IsBooleanString()
  final_url_live?: boolean;

  @IsBooleanString()
  target_url_redirects?: boolean;
}
