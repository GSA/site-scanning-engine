import { CoreResult } from '@app/database/core-results/core-result.entity';
import { WebsiteResult } from './website-result.dto';

export default (coreResult: CoreResult) => {
  const websiteResult: WebsiteResult = {
    target_url: '',
    target_url_domain: '',
    final_url: '',
    final_url_MIMETYPE: '',
    final_url_live: true,
    final_url_redirects: true,
    final_url_same_domain: true,
    final_url_same_website: true,
    final_url_status_code: 200,
    target_url_agency_owner: '',
    target_url_bureau_owner: '',
    target_url_branch_owner: '',
    target_url_status_code: 200,
    target_url_404_test: true,
    final_url_file_size_in_bytes: 2000,
  };

  return websiteResult;
};
