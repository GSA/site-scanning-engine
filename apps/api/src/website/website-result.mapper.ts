import { CoreResult } from '@app/database/core-results/core-result.entity';
import { WebsiteResult } from './website-result.dto';

function fromCoreResult(coreResult: CoreResult) {
  const websiteResult: WebsiteResult = {
    target_url: coreResult.website.url,
    target_url_domain: coreResult.targetUrlBaseDomain,
    final_url: coreResult.finalUrl,
    final_url_MIMETYPE: coreResult.finalUrlMIMEType,
    final_url_live: coreResult.finalUrlIsLive,
    final_url_same_domain: coreResult.finalUrlSameDomain,
    final_url_same_website: coreResult.finalUrlSameWebsite,
    final_url_status_code: coreResult.finalUrlStatusCode,
    target_url_redirects: coreResult.targetUrlRedirects,
    target_url_agency_owner: coreResult.website.agency,
    target_url_bureau_owner: coreResult.website.organization,
    target_url_branch_owner: coreResult.website.type,
  };

  return websiteResult;
}

export { fromCoreResult };
