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

// Note: The consumer now uses parseBrowserError from entities/scan-status for error classification

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
    const input: CoreInputDto = {
      websiteId: 1,
      url: '18f.gov', // Production data format: domain without protocol
      filter: false,
      pageviews: 1,
      visits: 1,
      scanId: '123',
    };

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
    const input: CoreInputDto = {
      websiteId: 1,
      url: '18f.gov', // Production data format: domain without protocol
      filter: false,
      pageviews: 1,
      visits: 1,
      scanId: '123',
    };

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
    const input: CoreInputDto = {
      websiteId: 1,
      url: 'bad-ssl.example.gov', // Production data format: domain without protocol
      filter: false,
      pageviews: 1,
      visits: 1,
      scanId: '123',
    };

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
      websiteId: 1,
      url: 'blackhole.webpagetest.org', // Production data format: domain without protocol
      filter: false,
      pageviews: 1,
      visits: 1,
      scanId: '123',
    };

    mockCoreJob.data = input;
    const timeoutError = new Error('Timeout');
    (mockCoreScanner.scan as any) = jest.fn().mockRejectedValue(timeoutError);

    await expect(consumer.processCore(mockCoreJob)).rejects.toThrow('Timeout');
    expect(mockCoreResultService.writeFailedResult).not.toHaveBeenCalled();
    expect(mockCoreResultService.createFromCoreResultPages).not.toHaveBeenCalled();
  });
});
