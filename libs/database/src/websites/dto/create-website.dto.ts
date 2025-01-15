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
  ombIdeaPublic: boolean;
  filter: boolean;
}
