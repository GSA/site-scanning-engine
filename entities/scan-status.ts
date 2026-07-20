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

/**
 * The set of failure statuses that represent permanent, non-retryable errors
 * (e.g. DNS resolution failures, invalid SSL certificates). Bull should not
 * retry jobs that result in one of these statuses.
 */
export const PERMANENT_FAILURE_STATUSES = new Set<AnyFailureStatus>([
  ScanStatus.DNSResolutionError,
  ScanStatus.InvalidSSLCert,
  ScanStatus.SslVersionCipherMismatch,
]);

/**
 * Returns true when the given failure status represents a permanent error that
 * should not be retried by the job queue.
 */
export const isPermanentFailure = (status: AnyFailureStatus): boolean =>
  PERMANENT_FAILURE_STATUSES.has(status);

/**
 * Classifies a browser (Puppeteer/Chrome) error into a ScanStatus.
 *
 * @param err - The error thrown during scanning.
 * @param logger - Optional pino logger. When omitted, classification still
 *   works but no log entries are produced. This allows callers that hold a
 *   non-pino logger (e.g. NestJS Logger) to classify errors without needing
 *   to construct a fake pino-compatible object.
 */
export const parseBrowserError = (
  err: Error,
  logger?: Logger,
): AnyFailureStatus => {
  const childLogger = logger
    ? logger.child({
        function: 'parseBrowserError',
        errorName: err.name,
        errorStack: err.stack,
        errorMessage: err.message,
      })
    : null;

  const warn = (meta: object, msg: string) => childLogger?.warn(meta, msg);

  if (
    (err.name && err.name === 'TimeoutError') ||
    (err.message &&
      (err.message.startsWith('net::ERR_CONNECTION_TIMED_OUT') ||
        err.message.startsWith('connect ETIMEDOUT') ||
        err.message.startsWith('net::ERR_TIMED_OUT')))
  ) {
    warn(
      { timeoutError: true, errorReturn: ScanStatus.Timeout },
      `Timeout: ${err.message}`,
    );
    return ScanStatus.Timeout;
  }

  if (err.message) {
    if (
      err.message.startsWith('net::ERR_NAME_NOT_RESOLVED') ||
      err.message.startsWith('getaddrinfo ENOTFOUND')
    ) {
      warn(
        {
          dnsResolutionError: true,
          errorReturn: ScanStatus.DNSResolutionError,
        },
        `DNS resolution error: ${err.message}`,
      );
      return ScanStatus.DNSResolutionError;
    }

    if (
      err.message.startsWith('net::ERR_CERT_COMMON_NAME_INVALID') ||
      err.message.startsWith('net::ERR_CERT_DATE_INVALID') ||
      err.message.startsWith('net::ERR_BAD_SSL_CLIENT_AUTH_CERT') ||
      err.message.startsWith('net::ERR_SSL_UNRECOGNIZED_NAME_ALERT') ||
      err.message.startsWith('unable to verify the first certificate')
    ) {
      warn(
        { invalidSSLCertError: true, errorReturn: ScanStatus.InvalidSSLCert },
        `Invalid SSL cert: ${err.message}`,
      );
      return ScanStatus.InvalidSSLCert;
    }

    if (
      err.message.startsWith('net::ERR_CONNECTION_REFUSED') ||
      err.message.startsWith('connect ECONNREFUSED')
    ) {
      warn(
        {
          connectionRefusedError: true,
          errorReturn: ScanStatus.ConnectionRefused,
        },
        `Connection refused: ${err.message}`,
      );
      return ScanStatus.ConnectionRefused;
    }

    if (
      err.message.startsWith('net::ERR_CONNECTION_RESET') ||
      err.message.startsWith('read ECONNRESET')
    ) {
      warn(
        {
          connectionResetError: true,
          errorReturn: ScanStatus.ConnectionReset,
        },
        `Connection reset: ${err.message}`,
      );
      return ScanStatus.ConnectionReset;
    }

    if (err.message.startsWith('net::ERR_CONNECTION_CLOSED')) {
      warn(
        {
          connectionClosedError: true,
          errorReturn: ScanStatus.ConnectionClosed,
        },
        `Connection closed: ${err.message}`,
      );
      return ScanStatus.ConnectionClosed;
    }

    if (err.message.startsWith('net::ERR_ADDRESS_UNREACHABLE')) {
      warn(
        {
          addressUnreachableError: true,
          errorReturn: ScanStatus.AddressUnreachable,
        },
        `Address unreachable: ${err.message}`,
      );
      return ScanStatus.AddressUnreachable;
    }

    if (err.message.startsWith('net::ERR_SSL_VERSION_OR_CIPHER_MISMATCH')) {
      warn(
        {
          sslVersionCipherMismatchError: true,
          errorReturn: ScanStatus.SslVersionCipherMismatch,
        },
        `SSL version/cipher mismatch: ${err.message}`,
      );
      return ScanStatus.SslVersionCipherMismatch;
    }

    if (err.message.startsWith('net::ERR_EMPTY_RESPONSE')) {
      warn(
        { emptyResponseError: true, errorReturn: ScanStatus.EmptyResponse },
        `Empty response: ${err.message}`,
      );
      return ScanStatus.EmptyResponse;
    }

    if (err.message.startsWith('net::ERR_HTTP2_PROTOCOL_ERROR')) {
      warn(
        { http2ErrorError: true, errorReturn: ScanStatus.Http2Error },
        `HTTP2 error: ${err.message}`,
      );
      return ScanStatus.Http2Error;
    }

    if (err.message.startsWith('net::ERR_TOO_MANY_REDIRECTS')) {
      warn(
        {
          tooManyRedirectsError: true,
          errorReturn: ScanStatus.TooManyRedirects,
        },
        `Too many redirects: ${err.message}`,
      );
      return ScanStatus.TooManyRedirects;
    }

    if (err.message.startsWith('Execution context was destroyed')) {
      warn(
        {
          executionContextDestroyedError: true,
          errorReturn: ScanStatus.ExecutionContextDestroyed,
        },
        `Execution context was destroyed: ${err.message}`,
      );
      return ScanStatus.ExecutionContextDestroyed;
    }

    if (err.message.startsWith('Page/Frame is not ready')) {
      warn(
        {
          pageFrameNotReady: true,
          errorReturn: ScanStatus.PageFrameNotReady,
        },
        `Page/Frame is not ready: ${err.message}`,
      );
      return ScanStatus.PageFrameNotReady;
    }

    if (err.message.startsWith('Evaluation failed')) {
      warn(
        {
          evaluationFailedError: true,
          errorReturn: ScanStatus.EvaluationFailed,
        },
        `Evaluation failed: ${err.message}`,
      );
      return ScanStatus.EvaluationFailed;
    }

    if (err.message.startsWith('net::ERR_INVALID_RESPONSE')) {
      warn(
        {
          invalidResponseError: true,
          errorReturn: ScanStatus.InvalidResponse,
        },
        `Invalid response: ${err.message}`,
      );
      return ScanStatus.InvalidResponse;
    }

    if (err.message.startsWith('net::ERR_INVALID_AUTH_CREDENTIALS')) {
      warn(
        {
          invalidAuthCredentialsError: true,
          errorReturn: ScanStatus.InvalidAuthCredentials,
        },
        `Invalid auth credentials: ${err.message}`,
      );
      return ScanStatus.InvalidAuthCredentials;
    }

    if (err.message.startsWith('net::ERR_SSL_PROTOCOL_ERROR')) {
      warn(
        {
          sslProtocolErrorError: true,
          errorReturn: ScanStatus.SslProtocolError,
        },
        `SSL protocol error: ${err.message}`,
      );
      return ScanStatus.SslProtocolError;
    }

    if (err.message.startsWith('net::ERR_ABORTED')) {
      warn(
        { abortedError: true, errorReturn: ScanStatus.Aborted },
        `Aborted: ${err.message}`,
      );
      return ScanStatus.Aborted;
    }

    if (err.toString() === 'Processing timed out') {
      warn(
        { timeoutError: true, errorReturn: ScanStatus.Timeout },
        `Timeout: ${err.message}`,
      );
      return ScanStatus.Timeout;
    }
  }

  warn(
    { unknownError: true, errorReturn: ScanStatus.UnknownError },
    `Unknown error: ${err.message}`,
  );

  return ScanStatus.UnknownError;
};
