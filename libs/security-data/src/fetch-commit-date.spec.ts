import { Logger } from '@nestjs/common';
import { fetchCommitDate } from './fetch-commit-date';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
} as unknown as Logger;

describe('fetchCommitDate', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns a YYYY-MM-DD string from the most recent commit date', async () => {
    const mockResponse = [
      { commit: { committer: { date: '2026-05-16T18:30:00Z' } } },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse),
    });

    const result = await fetchCommitDate(
      'data/source-lists/dap_top_100000_domains_30_days.csv',
      mockLogger,
    );

    expect(result).toBe('2026-05-16');
  });

  it('strips the time portion and keeps only YYYY-MM-DD', async () => {
    const mockResponse = [
      { commit: { committer: { date: '2026-01-01T00:00:00Z' } } },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse),
    });

    const result = await fetchCommitDate(
      'data/source-lists/cisa_https.csv',
      mockLogger,
    );

    expect(result).toBe('2026-01-01');
  });

  it('throws when the GitHub API returns a non-OK response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    });

    await expect(
      fetchCommitDate('data/source-lists/cisa_https.csv', mockLogger),
    ).rejects.toThrow('GitHub API request failed');
  });

  it('throws when the commits array is empty', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([]),
    });

    await expect(
      fetchCommitDate('data/source-lists/cisa_https.csv', mockLogger),
    ).rejects.toThrow('no commits');
  });
});
