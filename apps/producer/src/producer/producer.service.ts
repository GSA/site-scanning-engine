import { CORE_SCAN_JOB_NAME, SCANNER_QUEUE_NAME } from '@app/message-queue';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { CoreInputDto } from 'dtos/scanners/core.input.dto';

/**
 * ProducerService writes jobs to the message queue.
 *
 * @remarks The ProducerService is used to write jobs to a queue in order to be processed by
 * a scanner.
 */
@Injectable()
export class ProducerService {
  constructor(@InjectQueue(SCANNER_QUEUE_NAME) private scannerQueue: Queue) {}

  /**
   * addCoreJob adds a job to the queue that gets picked up by the CoreScanner.
   *
   * @param coreInput a CoreInputDto aka Data Transfer Object.
   *
   * @returns a Bull.Job<any> object.
   */
  async addCoreJob(coreInput: CoreInputDto) {
    const job = await this.scannerQueue.add(CORE_SCAN_JOB_NAME, coreInput);
    return job;
  }
}
