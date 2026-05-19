import { mock } from 'jest-mock-extended';
import { Logger } from 'pino';

import * as dns from './dns';

describe('dns scan', () => {
  it('integrates with node.js dns module', async () => {
    // See the jest setup. This first test uses a mock DNS resolution because gsa.gov has no AAAA
    // record if using internal DNS (i.e. while on VPN).
    const result = await dns.dnsScan(mock<Logger>(), 'gsa.gov');
    expect(result.ipv6).toEqual(true);
    expect(result.dnsHostname).toEqual('amazonaws.com');
  });

  it('catches an error when the scanned site has no IPv6 record available', async () => {
    // This test isn't subject to the VPN issue so it hits the network.
    const result = await dns.dnsScan(mock<Logger>(), 'github.com');
    expect(result.ipv6).toEqual(false);
    expect(result.dnsHostname).toEqual('github.com');
  });
});
