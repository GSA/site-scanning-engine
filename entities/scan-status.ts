import { Logger } from 'pino';

export enum ScanStatus {
  AddressUnreachable = 'address_unreachable',
  Completed = 'completed',
  ConnectionClosed = 'connection_closed',
  ConnectionRefused = 'connection_refused',
  ConnectionReset = 'connection_reset',
  DNSResolutionError = 'dns_resolution_error',
  EmptyResponse = 'empty_response',
  InvalidResponse = 'invalid_response',
  EvaluationFailed = 'evaluation_failed',
  ExecutionContextDestroyed = 'execution_context_destroyed',
  Http2Error = 'http2_error',
  InvalidSSLCert = 'invalid_ssl_cert',
  NotApplicable = 'not_applicable',
  PageFrameNotReady = 'page_frame_not_ready',
  Skipped = 'skipped',
  SslVersionCipherMismatch = 'ssl_version_cipher_mismatch',
  Timeout = 'timeout',
  TooManyRedirects = 'too_many_redirects',
  InvalidAuthCredentials = 'invalid_auth_credentials',
  SslProtocolError = 'ssl_protocol_error',
  Aborted = 'aborted',
  UnknownError = 'unknown_error',
}

export type AnySuccessfulStatus = ScanStatus.Completed;
export type AnyFailureStatus = Exclude<ScanStatus, ScanStatus.Completed>;

export const parseBrowserError = (err: Error, logger: Logger): AnyFailureStatus => {
  if (
    (err.name && err.name === 'TimeoutError') ||
    (err.message &&
      (err.message.startsWith('net::ERR_CONNECTION_TIMED_OUT') ||
        err.message.startsWith('connect ETIMEDOUT') ||
        err.message.startsWith('net::ERR_TIMED_OUT')))
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
      err.message.startsWith('net::ERR_SSL_UNRECOGNIZED_NAME_ALERT') ||
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

    if (err.message.startsWith('net::ERR_INVALID_RESPONSE')) {
      return ScanStatus.InvalidResponse;
    }

    if (err.message.startsWith('net::ERR_INVALID_AUTH_CREDENTIALS')) {
      return ScanStatus.InvalidAuthCredentials;
    }

    if (err.message.startsWith('net::ERR_SSL_PROTOCOL_ERROR')) {
      return ScanStatus.SslProtocolError;
    }

    if (err.message.startsWith('net::ERR_ABORTED')) {
      return ScanStatus.Aborted;
    }

    if (err.toString() === 'Processing timed out') {
      return ScanStatus.Timeout;
    }
  }
  logger.warn({unknownError: err}, `Unknown error: ${err.message}`);

  return ScanStatus.UnknownError;
};