import { Transform } from 'class-transformer';
import { IsBooleanString, IsString, IsUrl } from 'class-validator';

export class FilterWebsiteDto {
  @IsUrl()
  target_url_domain?: string;

  @IsUrl()
  final_url_domain?: string;

  @IsBooleanString()
  final_url_live?: boolean;

  @IsBooleanString()
  target_url_redirects?: boolean;

  // @Transform((value: string) => {
  //   decodeURI(value);
  // })
  @IsString()
  target_url_agency_owner?: string;
}
