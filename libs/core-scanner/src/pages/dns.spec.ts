import { mock } from 'jest-mock-extended';
import { Logger } from 'pino';

import * as dns from './dns';

describe('dns scan', () => {
  it('integrates with node.js dns module', async () => {
    const result = await dns.dnsScan(mock<Logger>(), 'gsa.gov');
    expect(result.ipv6).toEqual(true);
    expect(result.dnsHostname).toEqual('amazonaws.com');
  });

  it('catches an error when the scanned site has no IPv6 record available', async () => {
    const result = await dns.dnsScan(mock<Logger>(), 'github.com');
    expect(result.ipv6).toEqual(false);
    expect(result.dnsHostname).toEqual('github.com');
  });
});
