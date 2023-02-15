import { promises as dns } from 'dns';
import { Logger } from 'pino';
import { DnsScan } from 'entities/scan-data.entity';

export const dnsScan = async (
  logger: Logger,
  hostname: string,
): Promise<DnsScan> => {
  return {
    ipv6: await ipv6Scan(hostname, logger),
    dnsHostname: await hostnameScan(hostname, logger),
  };
};

const ipv6Scan = async (hostname, logger) => {
  try {
    const response = await dns.resolve6(hostname);
    logger.info('Resolved address is:', response);
    return true;
  } catch (error) {
    logger.info({ msg: 'No IPv6 record available', error });
    return false;
  }
};

const hostnameScan = async (hostname, logger) => {
  const cnameLookupResult = await cnameLookup(hostname, logger);
  const reverseLookupResult = await reverseLookup(hostname, logger);

  if (usesCloudService(cnameLookupResult)) return cnameLookupResult;
  if (usesCloudService(reverseLookupResult)) return reverseLookupResult;

  logger.info({ msg: 'No results from hostnameScan' });
  return null;
};

const cnameLookup = async (hostname, logger) => {
  try {
    const cnameResolution = await dns.resolveCname(hostname);
    return cnameResolution[0].split('.').slice(-2).join('.');
  } catch (error) {
    logger.info({ msg: 'Error during cname lookup:', error });
    return null;
  }
};

const reverseLookup = async (hostname, logger) => {
  try {
    const addresses = await dns.resolve(hostname);
    const hostnames = await dns.reverse(addresses[0]);
    const domain = hostnames[0].split('.').slice(-2).join('.');
    return domain;
  } catch (error) {
    logger.info({ msg: 'Error during reverse lookup:', error });
    return null;
  }
};

const usesCloudService = (domain): boolean => {
  if (!domain) return false;
  if (domain === 'cloud.gov' || domain === 'data.gov') return true;

  return cloudServiceStrings.some((string) => domain.includes(string));
};

const cloudServiceStrings = [
  'acquia',
  'akadns',
  'akamai',
  'aws',
  'azure',
  'cloudfront',
  'cloudflare',
  'edgekey',
  'github',
  'microsoft',
  'qip',
  'quest',
];
