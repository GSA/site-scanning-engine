export enum ScanStatus {
  Completed = 'completed',
  Timeout = 'timeout',
  DNSResolutionError = 'dns_resolution_error',
  UnknownError = 'unknown_error',
  InvalidSSLCert = 'invalid_ssl_cert',
}
