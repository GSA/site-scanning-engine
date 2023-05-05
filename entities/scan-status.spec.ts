import { ScanStatus, parseBrowserError } from './scan-status';

describe('scan-status', () => {
  describe('parseBrowserError', () => {
    it('should parse timeout error', () => {
      const err = new Error();
      err.name = 'TimeoutError';
      expect(parseBrowserError(err)).toBe(ScanStatus.Timeout);
    });

    it('should parse dns resolution error', () => {
      const err = new Error('net::ERR_NAME_NOT_RESOLVED');
      expect(parseBrowserError(err)).toBe(ScanStatus.DNSResolutionError);
    });

    it('should parse invalid ssl cert error', () => {
      const err = new Error('net::ERR_CERT_COMMON_NAME_INVALID');
      expect(parseBrowserError(err)).toBe(ScanStatus.InvalidSSLCert);
    });

    it('should parse connection refused error', () => {
      const err = new Error('net::ERR_CONNECTION_REFUSED');
      expect(parseBrowserError(err)).toBe(ScanStatus.ConnectionRefused);
    });

    it('should parse connection reset error', () => {
      const err = new Error('net::ERR_CONNECTION_RESET');
      expect(parseBrowserError(err)).toBe(ScanStatus.ConnectionReset);
    });

    it('should parse unknown error', () => {
      const err = new Error('UnknownError');
      expect(parseBrowserError(err)).toBe(ScanStatus.UnknownError);
    });
  });
});
