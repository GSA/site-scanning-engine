import { IsBooleanString, IsIn, IsString, IsUrl } from 'class-validator';

import { PaginationRequestDto } from 'apps/api/src/pagination-request.dto';
import { ScanStatus } from 'entities/scan-status';

const statuses = Object.values(ScanStatus);

/**
 * FilterWebsiteDto contains definitions of the available API queries.
 *
 * Note: Multiple queries are combined using AND semantics. This means that for any result,
 * all of the queries are true. For example, if one were to combine target_url_domain=gsa.gov&final_url_live=true
 * the result would be any entries in which both of those conditions are met.
 */
export class FilterWebsiteDto extends PaginationRequestDto {
  /**
   * `target_url_domain` is the domain name plus the top-level domain (TLD) of the target url.
   * The `target_url` is the url that the scanner starts with. This is in constrast to the `final_url` which
   * is the url where the scanner ends up, after following redirects.
   *
   * @example gsa.gov
   */
  @IsUrl()
  target_url_domain?: string;

  /**
   * `final_url_domain` is the domain name plus the top-level domain (TLD) of the final url.
   * The final url is the url where the scanner ends up, after following redirects. This is in contrast to
   * the target url, which is the url the scanner starts with.
   *
   * @example gsa.gov
   */
  @IsUrl()
  final_url_domain?: string;

  /**
   * `final_url_live` is a boolean that records whether the final url returns an HTTP status code that is in the 2xx
   * family.
   *
   * @example true
   */
  @IsBooleanString()
  final_url_live?: boolean;

  /**
   * `target_url_redirects` is a boolean that records whether the target url redirects. Another way of thinking about this
   * is that when `true`, the target url returned a `3xx` HTTP status code. Technical Note: the scanners have caching disabled, so
   * `304` HTTP status codes are not present in the system.
   *
   * @example true
   */
  @IsBooleanString()
  target_url_redirects?: boolean;

  /**
   * `target_url_agency_owner` is the agency that owns/operates the website associated with the target url.
   * _Note: The agency name must be url encoded (aka %20 encoded)._
   *
   * @example "Department of Energy"
   */
  @IsString()
  target_url_agency_owner?: string;

  /**
   * `target_url_bureau_owner` is the bureau that owns/operates the website associated with the target url.
   * _Note: The bureau name must be url encoded (aka %20 encoded)._
   *
   * @example "Argonne National Laboratory"
   */
  @IsString()
  target_url_bureau_owner?: string;

  /**
   * `scan_status` captures the status of the scan and any reason for failure (if known). _Note that `unknown_error`
   * is reserved for errors that aren't yet encoded in the system._
   *
   * @example completed
   */
  @IsIn(statuses)
  scan_status?: string;

  /**
   * `dap_detected_final_url` is a boolean that records whether the Digital Analytics Program is detected at the final url.
   *
   * @example true
   */
  @IsBooleanString()
  dap_detected_final_url?: boolean;
}
