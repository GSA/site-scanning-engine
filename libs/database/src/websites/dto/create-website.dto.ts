/**
 * CreateWebsiteDto is the fields required to create a website.
 */
export class CreateWebsiteDto {
  website: string;
  branch: string;
  agency: string;
  agencyCode?: number;
  bureau: string;
  bureauCode?: number;
  sourceListFedDomains: boolean;
  sourceListDap: boolean;
  sourceListPulse: boolean;
}
