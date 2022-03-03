import { mock } from 'jest-mock-extended';
import { Logger } from 'pino';

import * as dns from './dns';

describe('dns scan', () => {
  it('integrates with node.js dns module', async () => {
    expect(await dns.dnsScan(mock<Logger>(), 'gsa.gov')).toEqual(true);
  });
});
