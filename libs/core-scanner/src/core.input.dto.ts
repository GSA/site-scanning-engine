import { IsBoolean, IsNumber, IsString, IsUrl } from 'class-validator';

/**
 * CoreInputDto is a Data Transfer Object for input to the Core scanner.
 *
 * @remarks The CoreInputDto provides a consistent interface for passing data to the
 * Core scanners scan method. Additionally, it uses the class-validator library to provide
 * a validation schema.
 */
export class CoreInputDto {
  /**
   * websiteId is the id of the Website that we are scanning for. This is needed for creating one-to-one relations
   * between results and websites.
   */
  @IsNumber()
  websiteId: number;

  /**
   * url is a string representing a url of a website in the Federal Web Presence (.gov, .mil, etc.)
   *
   * @remarks This string is validated to be an actual URL.
   */
  @IsUrl()
  url: string;

  /**
   * filter is a boolean signifying whether a site was marked as filtered due to the contains or begins with filters.
   *
   */
  @IsBoolean()
  filter: boolean;

  /**
   * scanId is a string that will be used to uniquely identify this scan in logs.
   */
  @IsString()
  scanId: string;

  /**
   * page is an optional string that represents a specific page on a website to scan.
   */
  @IsString()
  page?: string;

  /**
   * scan is an optional string that represents a specific scan type to run.
   */
  @IsString()
  scan?: string;
}
