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
  sourceListFederalDomains: boolean;
  sourceListDap: boolean;
  sourceListPulse: boolean;
}
