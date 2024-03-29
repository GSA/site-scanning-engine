import { join } from 'path';

export default () => {
  return {
    dirPath: join(process.cwd(), 'security-data'),
    securityDataCsvUrl:
      'https://raw.githubusercontent.com/GSA/federal-website-index/main/data/dataset/cisa_https.csv',
  };
};
