import { ScanStatus, parseBrowserError } from './scan-status';
import pino from 'pino';

const mockLogger = pino();

describe('scan-status', () => {
  describe('parseBrowserError', () => {
    it('should parse timeout error', () => {
      const err = new Error();
      err.name = 'TimeoutError';
      expect(parseBrowserError(err, mockLogger)).toBe(ScanStatus.Timeout);
    });

    it('should parse timeout error', () => {
      const err = new Error('net::ERR_TIMED_OUT');
      expect(parseBrowserError(err, mockLogger)).toBe(ScanStatus.Timeout);
    });

    it('should parse dns resolution error', () => {
      const err = new Error('net::ERR_NAME_NOT_RESOLVED');
      expect(parseBrowserError(err, mockLogger)).toBe(ScanStatus.DNSResolutionError);
    });

    it('should parse invalid ssl cert error', () => {
      const err = new Error('net::ERR_CERT_COMMON_NAME_INVALID');
      expect(parseBrowserError(err, mockLogger)).toBe(ScanStatus.InvalidSSLCert);
    });

    it('should parse invalid ssl cert error', () => {
      const err = new Error('net::ERR_SSL_UNRECOGNIZED_NAME_ALERT');
      expect(parseBrowserError(err, mockLogger)).toBe(ScanStatus.InvalidSSLCert);
    });

    it('should parse connection refused error', () => {
      const err = new Error('net::ERR_CONNECTION_REFUSED');
      expect(parseBrowserError(err, mockLogger)).toBe(ScanStatus.ConnectionRefused);
    });

    it('should parse connection reset error', () => {
      const err = new Error('net::ERR_CONNECTION_RESET');
      expect(parseBrowserError(err, mockLogger)).toBe(ScanStatus.ConnectionReset);
    });

    it('should parse invalid response', () => {
      const err = new Error('net::ERR_INVALID_RESPONSE');
      expect(parseBrowserError(err, mockLogger)).toBe(ScanStatus.InvalidResponse);
    });

    it('should parse unknown error', () => {
      const err = new Error('UnknownError');
      expect(parseBrowserError(err, mockLogger)).toBe(ScanStatus.UnknownError);
    });

    it('should parse invalid auth credentials error', () => {
      const err = new Error('net::ERR_INVALID_AUTH_CREDENTIALS');
      expect(parseBrowserError(err, mockLogger)).toBe(ScanStatus.InvalidAuthCredentials);
    });

    it('should parse ssl protocol error', () => {
      const err = new Error('net::ERR_SSL_PROTOCOL_ERROR');
      expect(parseBrowserError(err, mockLogger)).toBe(ScanStatus.SslProtocolError);
    });

    it('should parse aborted error', () => {
      const err = new Error('net::ERR_ABORTED');
      expect(parseBrowserError(err, mockLogger)).toBe(ScanStatus.Aborted);
    });
  });
});
