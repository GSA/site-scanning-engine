import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IngestController } from './ingest.controller';
import { Command } from 'commander';
import { parseInt } from 'lodash';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  return app;
}

async function ingest(cmdObj) {
  const nestApp = await bootstrap();
  const controller = nestApp.get(IngestController);
  console.log('ingesting target urls');

  if (cmdObj.limit) {
    await controller.writeUrls(cmdObj.limit);
  } else {
    await controller.writeUrls();
  }

  const used = process.memoryUsage();
  for (const key in used) {
    console.log(
      `${key} ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`,
    );
  }
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
    .action(ingest);

  await program.parseAsync(process.argv);
}

main();
