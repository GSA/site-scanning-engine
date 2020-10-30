export class CreateCoreResultDto {
  websiteId: number;
  finalUrl: string;
  finalUrlIsLive: boolean;
  finalUrlBaseDomain: string;
  finalUrlMIMEType: string;
  finalUrlSameDomain: boolean;
  finalUrlStatusCode: number;
  finalUrlSameWebsite: boolean;
  targetUrlBaseDomain: string;
  targetUrlRedirects: boolean;
}
