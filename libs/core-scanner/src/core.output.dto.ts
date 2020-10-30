export class CoreOutputDto {
  websiteId: number;
  finalUrl: string;
  finalUrlIsLive: boolean;
  finalUrlBaseDomain: string;
  finalUrlMIMEType: string;
  finalUrlSameDomain: boolean;
  finalUrlSameWebsite: boolean;
  finalUrlStatusCode: number;
  targetUrlBaseDomain: string;
  targetUrlRedirects: boolean;
}
