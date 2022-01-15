export enum ScanStatus {
  Completed = 'completed',
  Timeout = 'timeout',
  DNSResolutionError = 'dns_resolution_error',
  UnknownError = 'unknown_error',
  InvalidSSLCert = 'invalid_ssl_cert',
  ConnectionRefused = 'connection_refused',
}

export const parseBrowserError = (err: Error) => {
  if (err.name === 'TimeoutError') {
    return ScanStatus.Timeout;
  }

  if (err.message.startsWith('net::ERR_NAME_NOT_RESOLVED')) {
    return ScanStatus.DNSResolutionError;
  }

  if (
    err.message.startsWith('net::ERR_CERT_COMMON_NAME_INVALID') ||
    err.message.startsWith('unable to verify the first certificate')
  ) {
    return ScanStatus.InvalidSSLCert;
  }

  if (err.message.startsWith('net::ERR_CONNECTION_REFUSED')) {
    return ScanStatus.ConnectionRefused;
  }

  return ScanStatus.UnknownError;
};
