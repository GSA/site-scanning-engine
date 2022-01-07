import { IsNumber, IsString, IsUrl } from 'class-validator';

/**
 * SolutionsInputDto is a Data Transfer Object for input to the SolutionsScanner.
 */
export class SolutionsInputDto {
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
   * scanId is a string that will be used to uniquely identify this scan in logs.
   */
  @IsString()
  scanId: string;
}
