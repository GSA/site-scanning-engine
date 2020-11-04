export enum ScanStatus {
  Completed = 'completed',
  Timeout = 'timeout',
  DNSResolutionError = 'dns_resolution_error',
  ScannerError = 'scanner_error',
  InvalidSSLCert = 'invalid_ssl_cert',
}
