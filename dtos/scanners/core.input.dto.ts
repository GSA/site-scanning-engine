import { IsString, IsUrl } from 'class-validator';

/**
 * CoreInputDto is a Data Transfer Object for input to the Core scanner.
 *
 * @remarks The CoreInputDto provides a consistent interface for passing data to the
 * Core scanners scan method. Additionally, it uses the class-validator library to provide
 * a validation schema.
 */
export class CoreInputDto {
  /**
   * url is a string representing a url of a website in the Federal Web Presence (.gov, .mil, etc.)
   *
   * @remarks This string is validated to be an actual URL.
   */
  @IsUrl()
  url: string;

  /**
   * agency is a string representing the Federal Agency owner of the url.
   *
   * @example
   * While the exact definition of "what an agency is" is hard to nail down,
   * this should be something like Housing and Urban Development or General Services Adminstration.
   */
  @IsString() // :TODO Using IsString might not be necessary
  agency: string;

  /**
   * branch is a string representing the branch of the agency that owns the url.
   *
   * @example
   * This would be something like "Executive Branch" or "Legislative Branch"
   */
  @IsString()
  branch: string;
}
