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

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.flushLogs();
  return app;
}

function printMemoryUsage() {
  const used = process.memoryUsage();
  for (const key in used) {
    console.log(
      `${key} ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`,
    );
  }
}

async function ingest(cmdObj) {
  const nestApp = await bootstrap();
  const controller = nestApp.get(IngestController);
  console.log('ingesting target urls');

  await controller.refreshUrls(cmdObj.limit, cmdObj.federalSubdomainsUrl);
  printMemoryUsage();
  await nestApp.close();
}

async function clearQueue() {
  const nestApp = await bootstrap();
  const controller = nestApp.get(QueueController);
  console.log('clearing queue');

  await controller.clearQueue();
  printMemoryUsage();
  await nestApp.close();
}

async function enqueueScans() {
  const nestApp = await bootstrap();
  const controller = nestApp.get(QueueController);
  console.log('enqueueing scan jobs');

  await controller.queueScans();
  printMemoryUsage();
  await nestApp.close();
}

async function createSnapshot() {
  const nestApp = await bootstrap();
  const controller = nestApp.get(SnapshotController);
  console.log('creating snapshot');

  await controller.weeklySnapshot();
  printMemoryUsage();
  await nestApp.close();
}

async function createAccessibilityResultsSnapshot() {
  const nestApp = await bootstrap();
  const controller = nestApp.get(SnapshotController);
  console.log('creating a11y results snapshot');

  await controller.accessibilityResultsSnapshot();
  printMemoryUsage();
  await nestApp.close();
}

async function scanSite(cmdObj) {
  const nestApp = await bootstrap();
  const controller = nestApp.get(ScanController);
  console.log(`scanning site: ${cmdObj.url}`);

  await controller.scanSite(cmdObj.url);
  printMemoryUsage();
  await nestApp.close();
}

async function securityData() {
  const nestApp = await bootstrap();
  const controller = nestApp.get(SecurityDataController);
  console.log('fetching and saving security data');

  await controller.fetchAndSaveSecurityData();
  printMemoryUsage();
  await nestApp.close();
}

async function requeueStaleScans() {
  const nestApp = await bootstrap();
  const controller = nestApp.get(QueueController);
  console.log('enqueueing scan jobs for stale results');

  await controller.queueStaleScans();
  printMemoryUsage();
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
    .action(ingest);

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

  // create-snapshot
  program
    .command('create-snapshot')
    .description(
      'create-snapshot writes a CSV and JSON of the current scans to S3',
    )
    .action(createSnapshot);

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
      'scan-site scans a given URL, which is expected to exist in the website table',
    )
    .option('--url <string>', 'URL to scan')
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

  await program.parseAsync(process.argv);
}

main();
