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
