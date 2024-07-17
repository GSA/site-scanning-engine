export enum ScanStatus {
  Completed = 'completed',
  Timeout = 'timeout',
  DNSResolutionError = 'dns_resolution_error',
  UnknownError = 'unknown_error',
  InvalidSSLCert = 'invalid_ssl_cert',
  ConnectionRefused = 'connection_refused',
  ConnectionReset = 'connection_reset',
  ConnectionClosed = 'connection_closed',
  AddressUnreachable = 'address_unreachable',
  SslVersionCipherMismatch = 'ssl_version_cipher_mismatch',
  EmptyResponse = 'empty_response',
  Http2Error = 'http2_error',
  TooManyRedirects = 'too_many_redirects',
  ExecutionContextDestroyed = 'execution_context_destroyed',
  PageFrameNotReady = 'page_frame_not_ready',
  EvaluationFailed = 'evaluation_failed',
  NotApplicable = 'not_applicable',
}

export const parseBrowserError = (err: Error): ScanStatus => {
  if (
    (err.name && err.name === 'TimeoutError') ||
    (err.message &&
      (err.message.startsWith('net::ERR_CONNECTION_TIMED_OUT') ||
        err.message.startsWith('connect ETIMEDOUT')))
  ) {
    return ScanStatus.Timeout;
  }

  if (err.message) {
    if (
      err.message.startsWith('net::ERR_NAME_NOT_RESOLVED') ||
      err.message.startsWith('getaddrinfo ENOTFOUND')
    ) {
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

    if (
      err.message.startsWith('net::ERR_CONNECTION_REFUSED') ||
      err.message.startsWith('connect ECONNREFUSED')
    ) {
      return ScanStatus.ConnectionRefused;
    }

    if (
      err.message.startsWith('net::ERR_CONNECTION_RESET') ||
      err.message.startsWith('read ECONNRESET')
    ) {
      return ScanStatus.ConnectionReset;
    }

    if (err.message.startsWith('net::ERR_CONNECTION_CLOSED')) {
      return ScanStatus.ConnectionClosed;
    }

    if (err.message.startsWith('net::ERR_ADDRESS_UNREACHABLE')) {
      return ScanStatus.AddressUnreachable;
    }

    if (err.message.startsWith('net::ERR_SSL_VERSION_OR_CIPHER_MISMATCH')) {
      return ScanStatus.SslVersionCipherMismatch;
    }

    if (err.message.startsWith('net::ERR_EMPTY_RESPONSE')) {
      return ScanStatus.EmptyResponse;
    }

    if (err.message.startsWith('net::ERR_HTTP2_PROTOCOL_ERROR')) {
      return ScanStatus.Http2Error;
    }

    if (err.message.startsWith('net::ERR_TOO_MANY_REDIRECTS')) {
      return ScanStatus.TooManyRedirects;
    }

    if (err.message.startsWith('Execution context was destroyed')) {
      return ScanStatus.ExecutionContextDestroyed;
    }

    if (err.message.startsWith('Page/Frame is not ready')) {
      return ScanStatus.PageFrameNotReady;
    }

    if (err.message.startsWith('Evaluation failed')) {
      return ScanStatus.EvaluationFailed;
    }
  }

  return ScanStatus.UnknownError;
};
