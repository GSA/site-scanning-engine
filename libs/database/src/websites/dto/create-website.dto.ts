/**
 * CreateWebsiteDto is the fields required to create a website.
 */
export class CreateWebsiteDto {
  website: string;
  topLevelDomain: string;
  branch: string;
  agency: string;
  bureau: string;
  sourceList: string;
  filter: boolean;
  pageviews: number;
  visits: number;
}
