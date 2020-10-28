import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IngestController } from './ingest.controller';
import { Command } from 'commander';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  return app;
}

async function ingest() {
  const nestApp = await bootstrap();
  const controller = nestApp.get(IngestController);
  console.log('ingesting target urls');
  await controller.writeUrls();
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
    .action(ingest);

  await program.parseAsync(process.argv);
}

main();
