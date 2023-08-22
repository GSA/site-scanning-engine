import { mock } from 'jest-mock-extended';
import { Logger } from 'pino';

import * as security from './security';

describe('dns scan', () => {
  it('scans for https enforcement and hsts preloading', async () => {
    const result = await security.securityScan(mock<Logger>(), 'gsa.gov');
    expect(result.httpsEnforced).toEqual(true);
    expect(result.hstsPreloading).toEqual(true);
  });
});
