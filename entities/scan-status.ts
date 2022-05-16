export enum ScanStatus {
  Completed = 'completed',
  Timeout = 'timeout',
  DNSResolutionError = 'dns_resolution_error',
  UnknownError = 'unknown_error',
  InvalidSSLCert = 'invalid_ssl_cert',
  ConnectionRefused = 'connection_refused',
  ConnectionReset = 'connection_reset',
}

export const parseBrowserError = (err: Error): ScanStatus => {
  if (err.name === 'TimeoutError') {
    return ScanStatus.Timeout;
  }

  if (err.message) {
    if (err.message.startsWith('net::ERR_NAME_NOT_RESOLVED')) {
      return ScanStatus.DNSResolutionError;
    }

    if (
      err.message.startsWith('net::ERR_CERT_COMMON_NAME_INVALID') ||
      err.message.startsWith('net::ERR_CERT_DATE_INVALID') ||
      err.message.startsWith('net::ERR_BAD_SSL_CLIENT_AUTH_CERT') ||
      err.message.startsWith('unable to verify the first certificate')
    ) {
      return ScanStatus.InvalidSSLCert;
    }

    if (err.message.startsWith('net::ERR_CONNECTION_REFUSED')) {
      return ScanStatus.ConnectionRefused;
    }

    if (err.message.startsWith('net::ERR_CONNECTION_RESET')) {
      return ScanStatus.ConnectionReset;
    }
  }

  return ScanStatus.UnknownError;
};
