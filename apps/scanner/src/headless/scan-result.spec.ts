import { ScanResult } from './scan-result';

describe('ScanResult', () => {
  let scanResult: ScanResult;

  beforeEach(async () => {
    scanResult = new ScanResult(
      'https://18f.gov',
      'https://18f.gsa.gov',
      200,
      ['https://18f.gov', 'https://18f.gsa.gov'],
      'GSA',
      'Executive',
    );
  });

  it('should be defined', () => {
    expect(scanResult).toBeDefined();
  });

  it('should serialize to JSON properly', () => {
    const serialized = scanResult.toJSON();
    expect(serialized).toEqual({
      agency: 'GSA',
      branch: 'Executive',
      final: {
        baseDomain: 'gsa.gov',
        statusCode: 200,
        url: 'https://18f.gsa.gov',
      },
      target: {
        baseDomain: '18f.gov',
        redirectChain: ['https://18f.gov', 'https://18f.gsa.gov'],
        redirects: true,
        url: 'https://18f.gov',
      },
    });
  });
});
