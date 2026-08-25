/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Logger } from 'pino';

jest.mock('pino', () => {
  const pinoMock: jest.Mocked<Logger> = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
    trace: jest.fn(),
    child: jest.fn().mockImplementation(() => pinoMock),
    level: 'info',
    flush: jest.fn(),
    silent: jest.fn(),
  } as unknown as jest.Mocked<Logger>;

  const mockPino = jest.fn(() => pinoMock);
  // @ts-ignore
  mockPino.default = mockPino; // Ensure that the default export is the mock
  return mockPino;
});

jest.mock('dns', () => {
  const actualDns = jest.requireActual('dns');
  return {
    ...actualDns,
    promises: {
      ...actualDns.promises,
      resolve6: jest.fn((hostname: string) => {
        if (hostname === 'gsa.gov') {
          return Promise.resolve(['2001:0db8:85a3:0000:0000:8a2e:0370:7334']);
        }
        // github.com has no AAAA record; surface the same error the real
        // resolver would so the ipv6Scan catch path is exercised offline.
        if (hostname === 'github.com') {
          return Promise.reject(
            Object.assign(new Error('queryAaaa ENOTFOUND github.com'), {
              code: 'ENOTFOUND',
            }),
          );
        }
        return actualDns.promises.resolve6(hostname);
      }),
      resolveCname: jest.fn((hostname: string) => {
        if (hostname === 'gsa.gov') {
          return Promise.resolve(['d2u8q06xshnec9.cloudfront.net.amazonaws.com']);
        }
        // github.com has no CNAME at the apex; mirror the resolver error so
        // hostnameScan falls through to the reverse lookup deterministically.
        if (hostname === 'github.com') {
          return Promise.reject(
            Object.assign(new Error('queryCname ENOTIMP github.com'), {
              code: 'ENOTIMP',
            }),
          );
        }
        return actualDns.promises.resolveCname(hostname);
      }),
      resolve: jest.fn((hostname: string) => {
        if (hostname === 'github.com') {
          return Promise.resolve(['140.82.114.3']);
        }
        return actualDns.promises.resolve(hostname);
      }),
      reverse: jest.fn((ip: string) => {
        if (ip === '140.82.114.3') {
          return Promise.resolve(['lb-140-82-114-3-iad.github.com']);
        }
        return actualDns.promises.reverse(ip);
      }),
    },
  };
});
