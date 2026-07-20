import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';
import { Job } from 'bull';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { CoreResultService } from '@app/database/core-results/core-result.service';

import { CoreResult } from 'entities/core-result.entity';
import { Scanner } from 'libs/scanner.interface';
import { CoreScannerService } from 'libs/core-scanner/src';

import { ScanEngineConsumer } from './scan-engine.consumer';
import { QueueService } from '@app/queue';
import { ScanStatus } from 'entities/scan-status';

// URLs in test inputs use the production format: bare domain without protocol
// (e.g. '18f.gov', not 'https://18f.gov'). This mirrors how CoreInputDto.url
// is populated by the ingest pipeline.
const defaultInput: CoreInputDto = {
  websiteId: 1,
  url: '18f.gov',
  filter: false,
  pageviews: 1,
  visits: 1,
  scanId: '123',
};

describe('ScanEngineConsumer', () => {
  let consumer: ScanEngineConsumer;
  let module: TestingModule;
  let mockCoreResultService: MockProxy<CoreResultService>;
  let mockCoreScanner: MockProxy<Scanner<CoreInputDto, CoreResult>>;
  let mockCoreJob: MockProxy<Job<CoreInputDto>>;
  let mockQueueService: MockProxy<QueueService>;

  beforeEach(async () => {
    mockCoreResultService = mock<CoreResultService>();
    mockCoreScanner = mock<Scanner<CoreInputDto, CoreResult>>();
    mockCoreJob = mock<Job<CoreInputDto>>();
    mockQueueService = mock<QueueService>();
    module = await Test.createTestingModule({
      providers: [
        ScanEngineConsumer,
        {
          provide: CoreResultService,
          useValue: mockCoreResultService,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
        {
          provide: CoreScannerService,
          useValue: mockCoreScanner,
        },
      ],
    }).compile();

    consumer = module.get<ScanEngineConsumer>(ScanEngineConsumer);
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  it('should call the CoreResultService', async () => {
    const input = defaultInput;
    mockCoreJob.data = input;
    const coreResultFromPages = { id: input.websiteId } as CoreResult;
    (mockCoreScanner.scan as any) = jest.fn().mockResolvedValue(coreResultFromPages);

    await consumer.processCore(mockCoreJob);
    expect(
      mockCoreResultService.createFromCoreResultPages,
    ).toHaveBeenCalledWith(
      input.websiteId,
      coreResultFromPages,
      consumer['logger'],
      input.filter,
      input.pageviews,
      input.visits,
      input.url,
    );
  });

  it('should call writeFailedResult when coreScanner.scan throws a permanent DNS error', async () => {
    const input = defaultInput;
    mockCoreJob.data = input;
    const dnsError = new Error('net::ERR_NAME_NOT_RESOLVED');
    (mockCoreScanner.scan as any) = jest.fn().mockRejectedValue(dnsError);

    await consumer.processCore(mockCoreJob);

    expect(mockCoreResultService.writeFailedResult).toHaveBeenCalledWith(
      input.websiteId,
      ScanStatus.DNSResolutionError,
      expect.anything(),
      input.filter,
      input.pageviews,
      input.visits,
      input.url,
    );
    expect(mockCoreResultService.createFromCoreResultPages).not.toHaveBeenCalled();
  });

  it('should call writeFailedResult when coreScanner.scan throws a permanent SSL error', async () => {
    const input: CoreInputDto = { ...defaultInput, url: 'bad-ssl.example.gov' };
    mockCoreJob.data = input;
    const sslError = new Error('net::ERR_CERT_COMMON_NAME_INVALID');
    (mockCoreScanner.scan as any) = jest.fn().mockRejectedValue(sslError);

    await consumer.processCore(mockCoreJob);

    expect(mockCoreResultService.writeFailedResult).toHaveBeenCalledWith(
      input.websiteId,
      ScanStatus.InvalidSSLCert,
      expect.anything(),
      input.filter,
      input.pageviews,
      input.visits,
      input.url,
    );
    expect(mockCoreResultService.createFromCoreResultPages).not.toHaveBeenCalled();
  });

  it('should rethrow non-permanent errors for Bull to retry', async () => {
    const input: CoreInputDto = {
      ...defaultInput,
      url: 'blackhole.webpagetest.org',
    };
    mockCoreJob.data = input;
    const timeoutError = new Error('Timeout');
    (mockCoreScanner.scan as any) = jest.fn().mockRejectedValue(timeoutError);

    await expect(consumer.processCore(mockCoreJob)).rejects.toThrow('Timeout');
    expect(mockCoreResultService.writeFailedResult).not.toHaveBeenCalled();
    expect(mockCoreResultService.createFromCoreResultPages).not.toHaveBeenCalled();
  });

  describe('onFailed', () => {
    // Helper to build a minimal mock Job for the onFailed handler.
    // `attemptsMade` reflects how many attempts have been made so far.
    function makeFailedJob(
      input: CoreInputDto,
      attemptsMade: number,
      attempts: number,
    ): Job<CoreInputDto> {
      return {
        id: 'test-job-id',
        data: input,
        attemptsMade,
        opts: { attempts },
      } as unknown as Job<CoreInputDto>;
    }

    it('should write a failure result when retries are exhausted (final attempt)', async () => {
      const input = defaultInput;
      const job = makeFailedJob(input, 3, 3);
      const timeoutError = new Error('net::ERR_TIMED_OUT');

      await consumer.onFailed(job, timeoutError);

      expect(mockCoreResultService.writeFailedResult).toHaveBeenCalledWith(
        input.websiteId,
        ScanStatus.Timeout,
        expect.anything(),
        input.filter,
        input.pageviews,
        input.visits,
        input.url,
      );
    });

    it('should write an UnknownError result when the error does not match a known pattern', async () => {
      const input = defaultInput;
      const job = makeFailedJob(input, 3, 3);
      const unknownError = new Error('some unexpected error message');

      await consumer.onFailed(job, unknownError);

      expect(mockCoreResultService.writeFailedResult).toHaveBeenCalledWith(
        input.websiteId,
        ScanStatus.UnknownError,
        expect.anything(),
        input.filter,
        input.pageviews,
        input.visits,
        input.url,
      );
    });

    it('should NOT write a failure result on an intermediate (non-final) attempt', async () => {
      const input = defaultInput;
      // attemptsMade=1, attempts=3 → two retries remain
      const job = makeFailedJob(input, 1, 3);
      const timeoutError = new Error('net::ERR_TIMED_OUT');

      await consumer.onFailed(job, timeoutError);

      expect(mockCoreResultService.writeFailedResult).not.toHaveBeenCalled();
    });

    it('should NOT write a failure result on a second intermediate attempt', async () => {
      const input = defaultInput;
      // attemptsMade=2, attempts=3 → one retry remains
      const job = makeFailedJob(input, 2, 3);
      const connectionResetError = new Error('net::ERR_CONNECTION_RESET');

      await consumer.onFailed(job, connectionResetError);

      expect(mockCoreResultService.writeFailedResult).not.toHaveBeenCalled();
    });
  });
});
