import { NestFactory } from '@nestjs/core';
import { Command } from 'commander';
import { parseInt } from 'lodash';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { IngestController } from './ingest.controller';
import { QueueController } from './queue.controller';
import { ScanController } from './scan.controller';
import { SnapshotController } from './snapshot.controller';
import { SecurityDataController } from './security-data.controller';

import pino from 'pino';
import { getRootLogger } from '../../../libs/logging/src';
import { logCount } from '../../../libs/logging/src/metric-utils';

function createCommandLogger(
  commandName: string,
  options = undefined,
): pino.Logger {
  const appLogger = getRootLogger();
  return appLogger.child({
    cliCommand: commandName,
    sseContext: 'Cli.Main',
    cliOptions: options,
  });
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.flushLogs();
  return app;
}

function printMemoryUsage(logger: pino.Logger) {
  const used = process.memoryUsage();
  for (const key in used) {
    const valueMb = Math.round((used[key] / 1024 / 1024) * 100) / 100;
    logCount(
      logger,
      {
        metricUnit: 'megabytes',
      },
      `scanner.core.memory.used.${key}.mb`,
      `Memory used: ${key}: ${valueMb} MB`,
      valueMb,
    );
  }
}

async function ingest(cmdObj) {
  const nestApp = await bootstrap();
  const logger = createCommandLogger('ingest', {
    limit: cmdObj.limit,
    federalSubdomainsUrl: cmdObj.federalSubdomainsUrl,
  });
  const controller = nestApp.get(IngestController);
  logger.info('ingesting target urls');

  await controller.refreshUrls(cmdObj.limit, cmdObj.federalSubdomainsUrl);
  printMemoryUsage(logger);
  await nestApp.close();
}

async function clearQueue() {
  const nestApp = await bootstrap();
  const logger = createCommandLogger('clear-queue');
  const controller = nestApp.get(QueueController);
  logger.info('clearing queue');

  await controller.clearQueue();
  printMemoryUsage(logger);
  await nestApp.close();
}

async function enqueueScans() {
  const nestApp = await bootstrap();
  const logger = createCommandLogger('enqueue-scans');
  const controller = nestApp.get(QueueController);
  logger.info('enqueueing scan jobs');

  await controller.queueScans();
  printMemoryUsage(logger);
  await nestApp.close();
}

async function checkQueueStatus() {
  const nestApp = await bootstrap();
  const logger = createCommandLogger('check-queue-status');
  const controller = nestApp.get(QueueController);
  logger.info('checking queue status');

  const queueStatus = await controller.getQueueStatus();
  logger.info(
    { jobsRemaining: queueStatus.count },
    `${queueStatus.count} jobs remaining in queue`,
  );
  logger.info(
    { activeJobs: queueStatus.activeCount },
    `${queueStatus.activeCount} active jobs in queue`,
  );
  printMemoryUsage(logger);
  await nestApp.close();
}

async function enqueueSite(cmdObj) {
  const nestApp = await bootstrap();
  const logger = createCommandLogger('enqueue-site', { url: cmdObj.url });
  const controller = nestApp.get(QueueController);
  logger.info('enqueueing specific url');

  await controller.queueSite(cmdObj.url);
  printMemoryUsage(logger);
  await nestApp.close();
}

async function enqueueLimitedScans(cmdObj) {
  const nestApp = await bootstrap();
  const logger = createCommandLogger('enqueue-limited-scans', {
    limit: cmdObj.limit,
  });
  const controller = nestApp.get(QueueController);
  logger.info('enqueueing limited scan jobs');

  await controller.queueScans(cmdObj.limit);
  printMemoryUsage(logger);
  await nestApp.close();
}

async function createDailySnapshot() {
  const nestApp = await bootstrap();
  const logger = createCommandLogger('create-daily-snapshot');
  const controller = nestApp.get(SnapshotController);
  logger.info('creating snapshot');

  await controller.dailySnapshot();
  printMemoryUsage(logger);
  await nestApp.close();
}

async function createAccessibilityResultsSnapshot() {
  const nestApp = await bootstrap();
  const logger = createCommandLogger('create-a11y-snapshot');
  const controller = nestApp.get(SnapshotController);
  logger.info('creating a11y results snapshot');

  await controller.accessibilityResultsSnapshot();
  printMemoryUsage(logger);
  await nestApp.close();
}

async function scanSite(cmdObj) {
  const nestApp = await bootstrap();
  const logger = createCommandLogger('scan-site', {
    url: cmdObj.url,
    page: cmdObj.page,
    scan: cmdObj.scan,
  });
  const controller = nestApp.get(ScanController);

  logger.info(
    `Scanning site: ${cmdObj.url}, page: ${cmdObj.page ?? 'ALL'}, scan: ${cmdObj.scan ?? 'ALL'}`,
  );

  await controller.scanSite(cmdObj.url, cmdObj.page, cmdObj.scan);
  printMemoryUsage(logger);
  await nestApp.close();
}

async function securityData() {
  const nestApp = await bootstrap();
  const logger = createCommandLogger('security-data');
  const controller = nestApp.get(SecurityDataController);
  logger.info('fetching and saving security data');

  await controller.fetchAndSaveSecurityData();
  printMemoryUsage(logger);
  await nestApp.close();
}

async function requeueStaleScans() {
  const nestApp = await bootstrap();
  const logger = createCommandLogger('requeue-stale-scans');
  const controller = nestApp.get(QueueController);
  logger.info('enqueueing scan jobs for stale results');

  await controller.queueStaleScans();
  printMemoryUsage(logger);
  await nestApp.close();
}

async function queuePrimaryTimeout() {
  const nestApp = await bootstrap();
  const logger = createCommandLogger('queue-timed-out-scans');
  const controller = nestApp.get(QueueController);
  logger.info('enqueueing scan jobs for timed out results');

  await controller.queuePrimaryTimeout();
  printMemoryUsage(logger);
  await nestApp.close();
}

async function main() {
  const program = new Command();
  program.version('0.0.1');
  program.description(
    'A command line interface for the site-scanning application.',
  );

  // ingest
  program
    .command('ingest')
    .description('ingest adds target urls to the Website database table')
    .option(
      '--limit <number>',
      'limits the ingest service to <number> urls',
      parseInt,
    )
    .option(
      '--federalSubdomainsUrl <string>',
      'URL pointing to CSV of federal subdomains',
    )
    .action((cmdObj) => ingest(cmdObj));

  // clear-queue
  program
    .command('clear-queue')
    .description('clears the Redis queue and cleans up old jobs')
    .action(clearQueue);

  // queue-scans
  program
    .command('enqueue-scans')
    .description(
      'enqueue-scans adds each target in the Website database table to the redis queue',
    )
    .action(enqueueScans);

  // queue-site
  program
    .command('enqueue-site')
    .description(
      'enqueue-site add 1 site from the Website database table to the redis queue',
    )
    .option('--url <string>', 'queue up one specific site by URL')
    .action(enqueueSite);

  // queue-status
  program
    .command('queue-status')
    .description(
      'queue-status retrieves the active and remaining jobs in the redis queue',
    )
    .action(checkQueueStatus);

  // queue-limited-scans
  program
    .command('enqueue-limited-scans')
    .description(
      'enqueue-scans-limit adds a limited set of targets from the Website database table to the redis queue',
    )
    .option(
      '--limit <number>',
      'limits the enqueue service to <number> urls',
      parseInt,
    )
    .action((cmdObj) => enqueueLimitedScans(cmdObj));

  // create-daily-snapshot
  program
    .command('create-daily-snapshot')
    .description(
      'create-daily-snapshot writes a CSV and JSON of the current scans to S3',
    )
    .action(createDailySnapshot);

  // create-a11y-snapshot
  program
    .command('create-a11y-snapshot')
    .description(
      'create-a11y-snapshot writes a JSON of the current a11y scan result details to S3',
    )
    .action(createAccessibilityResultsSnapshot);

  // scan-site
  program
    .command('scan-site')
    .description(
      'scan-site scans a given URL, which MUST exist in the website table',
    )
    .option('--url <string>', 'URL to scan')
    .option('--page <string>', 'Page to scan (optional)')
    .option('--scan <string>', 'Scan type (optional)')
    .action(scanSite);

  // security-data
  program
    .command('security-data')
    .description(
      'security-data fetches security data from a CSV and saves it to disk',
    )
    .action(securityData);

  // requeue stale scans
  program
    .command('requeue-stale-scans')
    .description(
      'enqueue all websites with core results that were last updated prior to the current date',
    )
    .action(requeueStaleScans);

  // queue timed out scans
  program
    .command('queue-primary-timeout')
    .description(
      'enqueue all websites with core results that were marked with a primaryScanStatus as timeout',
    )
    .action(queuePrimaryTimeout);

  await program.parseAsync(process.argv);
}

main();
