/**
 * CreateWebsiteDto is the fields required to create a website.
 */
export class CreateWebsiteDto {
  url: string;
  type: string;
  agency: string;
  organization: string;
  city: string;
  state: string;
  securityContactEmail: string;
}
