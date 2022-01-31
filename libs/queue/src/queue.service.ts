import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { CORE_SCAN_JOB_NAME, SCANNER_QUEUE_NAME } from '@app/message-queue';

/**
 * QueueService writes jobs to the message queue.
 *
 * @remarks The QueueService is used to write jobs to a queue in order to be processed by
 * a scanner.
 */
@Injectable()
export class QueueService {
  constructor(@InjectQueue(SCANNER_QUEUE_NAME) private scannerQueue: Queue) {}

  /**
   * addCoreJob adds a job to the queue that gets picked up by the CoreScanner.
   *
   * @param coreInput a CoreInputDto aka Data Transfer Object.
   *
   * @returns a Bull.Job<any> object.
   */
  async addCoreJob(coreInput: CoreInputDto) {
    const job = await this.scannerQueue.add(CORE_SCAN_JOB_NAME, coreInput, {
      removeOnComplete: true,
      attempts: 3,
    });
    return job;
  }

  /**
   * `emptyAndClean` clears the queue and cleans up old jobs.
   */
  async emptyAndClean() {
    await this.scannerQueue.empty();
    await Promise.all([
      this.scannerQueue.clean(0, 'active'),
      this.scannerQueue.clean(0, 'completed'),
      this.scannerQueue.clean(0, 'delayed'),
      this.scannerQueue.clean(0, 'failed'),
      this.scannerQueue.clean(0, 'paused'),
      this.scannerQueue.clean(0, 'wait'),
    ]);
  }

  async getQueueStatus() {
    const [
      activeCount,
      count,
      //jobCounts,
    ] = await Promise.all([
      this.scannerQueue.getActiveCount(),
      this.scannerQueue.count(),
      //this.scannerQueue.getJobCounts(),
    ]);
    return {
      count,
      activeCount,
      //jobCounts,
    };
  }
}
