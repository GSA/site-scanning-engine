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
  const childLogger = logger.child({function: 'parseBrowserError', errorName: err.name, errorStack: err.stack, errorMessage: err.message});
  if (
    (err.name && err.name === 'TimeoutError') ||
    (err.message &&
      (err.message.startsWith('net::ERR_CONNECTION_TIMED_OUT') ||
        err.message.startsWith('connect ETIMEDOUT') ||
        err.message.startsWith('net::ERR_TIMED_OUT')))
  ) {
    childLogger.warn({timeoutError : true, errorReturn: ScanStatus.Timeout}, `Timeout: ${err.message}`);
    return ScanStatus.Timeout;
  }

  if (err.message) {
    if (
      err.message.startsWith('net::ERR_NAME_NOT_RESOLVED') ||
      err.message.startsWith('getaddrinfo ENOTFOUND')
    ) {
      childLogger.warn({dnsResolutionError: true, errorReturn: ScanStatus.DNSResolutionError}, `DNS resolution error: ${err.message}`);
      return ScanStatus.DNSResolutionError;
    }

    if (
      err.message.startsWith('net::ERR_CERT_COMMON_NAME_INVALID') ||
      err.message.startsWith('net::ERR_CERT_DATE_INVALID') ||
      err.message.startsWith('net::ERR_BAD_SSL_CLIENT_AUTH_CERT') ||
      err.message.startsWith('net::ERR_SSL_UNRECOGNIZED_NAME_ALERT') ||
      err.message.startsWith('unable to verify the first certificate')
    ) {
      childLogger.warn({invalidSSLCertError: true, errorReturn: ScanStatus.InvalidSSLCert}, `Invalid SSL cert: ${err.message}`);
      return ScanStatus.InvalidSSLCert;
    }

    if (
      err.message.startsWith('net::ERR_CONNECTION_REFUSED') ||
      err.message.startsWith('connect ECONNREFUSED')
    ) {
      childLogger.warn({connectionRefusedError: true, errorReturn: ScanStatus.ConnectionRefused}, `Connection refused: ${err.message}`);
      return ScanStatus.ConnectionRefused;
    }

    if (
      err.message.startsWith('net::ERR_CONNECTION_RESET') ||
      err.message.startsWith('read ECONNRESET')
    ) {
      childLogger.warn({connectionResetError: true, errorReturn: ScanStatus.ConnectionReset}, `Connection reset: ${err.message}`);
      return ScanStatus.ConnectionReset;
    }

    if (err.message.startsWith('net::ERR_CONNECTION_CLOSED')) {
      childLogger.warn({connectionClosedError: true, errorReturn: ScanStatus.ConnectionClosed}, `Connection closed: ${err.message}`);
      return ScanStatus.ConnectionClosed;
    }

    if (err.message.startsWith('net::ERR_ADDRESS_UNREACHABLE')) {
      childLogger.warn({addressUnreachableError: true, errorReturn: ScanStatus.AddressUnreachable}, `Address unreachable: ${err.message}`);
      return ScanStatus.AddressUnreachable;
    }

    if (err.message.startsWith('net::ERR_SSL_VERSION_OR_CIPHER_MISMATCH')) {
      childLogger.warn({sslVersionCipherMismatchError: true, errorReturn: ScanStatus.SslVersionCipherMismatch}, `SSL version/cipher mismatch: ${err.message}`);
      return ScanStatus.SslVersionCipherMismatch;
    }

    if (err.message.startsWith('net::ERR_EMPTY_RESPONSE')) {
      childLogger.warn({emptyResponseError: true, errorReturn: ScanStatus.EmptyResponse}, `Empty response: ${err.message}`);
      return ScanStatus.EmptyResponse;
    }

    if (err.message.startsWith('net::ERR_HTTP2_PROTOCOL_ERROR')) {
      childLogger.warn({http2ErrorError: true, errorReturn: ScanStatus.Http2Error}, `HTTP2 error: ${err.message}`);
      return ScanStatus.Http2Error;
    }

    if (err.message.startsWith('net::ERR_TOO_MANY_REDIRECTS')) {
      childLogger.warn({tooManyRedirectsError: true, errorReturn: ScanStatus.TooManyRedirects}, `Too many redirects: ${err.message}`);
      return ScanStatus.TooManyRedirects;
    }

    if (err.message.startsWith('Execution context was destroyed')) {
      childLogger.warn({executionContextDestroyedError: true, errorReturn: ScanStatus.ExecutionContextDestroyed}, `Execution context was destroyed: ${err.message}`);
      return ScanStatus.ExecutionContextDestroyed;
    }

    if (err.message.startsWith('Page/Frame is not ready')) {
      childLogger.warn({pageFrameNotReady: true, errorReturn: ScanStatus.PageFrameNotReady}, `Page/Frame is not ready: ${err.message}`);
      return ScanStatus.PageFrameNotReady;
    }

    if (err.message.startsWith('Evaluation failed')) {
      childLogger.warn({evaluationFailedError: true, errorReturn: ScanStatus.EvaluationFailed}, `Evaluation failed: ${err.message}`);
      return ScanStatus.EvaluationFailed;
    }

    if (err.message.startsWith('net::ERR_INVALID_RESPONSE')) {
      childLogger.warn({invalidResponseError: true, errorReturn: ScanStatus.InvalidResponse}, `Invalid response: ${err.message}`);
      return ScanStatus.InvalidResponse;
    }

    if (err.message.startsWith('net::ERR_INVALID_AUTH_CREDENTIALS')) {
      childLogger.warn({invalidAuthCredentialsError: true, errorReturn: ScanStatus.InvalidAuthCredentials}, `Invalid auth credentials: ${err.message}`);
      return ScanStatus.InvalidAuthCredentials;
    }

    if (err.message.startsWith('net::ERR_SSL_PROTOCOL_ERROR')) {
      childLogger.warn({sslProtocolErrorError: true, errorReturn: ScanStatus.SslProtocolError}, `SSL protocol error: ${err.message}`);
      return ScanStatus.SslProtocolError;
    }

    if (err.message.startsWith('net::ERR_ABORTED')) {
      childLogger.warn({abortedError: true, errorReturn: ScanStatus.Aborted}, `Aborted: ${err.message}`);
      return ScanStatus.Aborted;
    }

    if (err.toString() === 'Processing timed out') {
      childLogger.warn({timeoutError: true, errorReturn: ScanStatus.Timeout}, `Timeout: ${err.message}`);
      return ScanStatus.Timeout;
    }
  }
  childLogger.warn({unknownError: true, errorReturn: ScanStatus.UnknownError}, `Unknown error: ${err.message}`);

  return ScanStatus.UnknownError;
};