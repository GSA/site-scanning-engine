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
      resolve6: jest.fn((hostname: string) => {
        if (hostname === 'gsa.gov') {
          return Promise.resolve(['2001:0db8:85a3:0000:0000:8a2e:0370:7334']);
        }
        return actualDns.promises.resolve6(hostname);
      }),
      resolveCname: jest.fn((hostname: string) => {
        if (hostname === 'gsa.gov') {
          return Promise.resolve(['d2u8q06xshnec9.cloudfront.net.amazonaws.com']);
        }
        return actualDns.promises.resolveCname(hostname);
      }),
      resolve: jest.fn((hostname: string) => {
        if (hostname === 'gsa.gov') {
          return Promise.resolve(['13.249.70.113']);
        }
        return actualDns.promises.resolve(hostname);
      }),
      reverse: jest.fn((ip: string) => {
        if (ip === '13.249.70.113') {
          return Promise.resolve(['server-13-249-70-113.iad89.r.cloudfront.net']);
        }
        return actualDns.promises.reverse(ip);
      }),
    },
  };
});
