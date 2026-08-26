#!/usr/bin/env ts-node

/**
 * Export snapshot CSV — two modes:
 *
 *   --live      Live-scan a list of domains (no Postgres required). Results are
 *               produced entirely in-memory via the real CoreScannerService →
 *               CoreResult mapping → website.serialized() pipeline, then written
 *               to CSV. This is the fast "preview before publishing" path.
 *
 *               Default domains (edit LIVE_DOMAINS below to customize):
 *                 18f.gov, gsa.gov, poolsafety.gov
 *
 *               Override: --domains "example.gov,other.gov"
 *
 *   (no flag)   DB-backed path — connect to Postgres, join website ⨝ coreResult,
 *               export the full table. Mirrors production exactly. Requires
 *               POSTGRES_USER and POSTGRES_PASSWORD env vars.
 *
 *   --include-hidden   Append @Exclude()-ed columns after the public snapshot
 *                      columns so you can review a field before removing its
 *                      @Exclude() and publishing it. Works in both --live and
 *                      DB-backed modes. This replaces the old manual column-
 *                      splice recipe that was documented in a comment block.
 *
 *   --output path/to/file.csv   Write to file instead of stdout.
 *
 * DB-backed environment variables:
 *   DATABASE_HOST     (default: localhost)
 *   DATABASE_PORT     (default: 5432)
 *   POSTGRES_USER     (required in DB mode)
 *   POSTGRES_PASSWORD (required in DB mode)
 *   DATABASE_NAME     (default: postgres)
 *   DATABASE_SSL      (default: true)
 *
 * Examples:
 *   # Preview new field for 18f.gov + defaults before publishing (no DB needed):
 *   npx ts-node scripts/export-snapshot.ts --live --include-hidden
 *
 *   # Custom domains:
 *   npx ts-node scripts/export-snapshot.ts --live --domains "18f.gov,nasa.gov"
 *
 *   # Full DB export with hidden columns:
 *   POSTGRES_USER=u POSTGRES_PASSWORD=p \
 *   npx ts-node scripts/export-snapshot.ts --include-hidden --output out.csv
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { format } from '@fast-csv/format';
import * as fs from 'fs';
import * as process from 'process';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { CoreResult } from '../entities/core-result.entity';
import { Website } from '../entities/website.entity';
import { BrowserModule } from '@app/browser';
import { CoreScannerModule, CoreScannerService } from '@app/core-scanner';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import {
  buildCoreResult,
  buildWebsite,
  buildColumnList,
  serializeRow,
} from '../libs/snapshot/test/scan-to-csv.helper';

// ---------------------------------------------------------------------------
// Default domain list for --live mode. Edit this to customize.
// ---------------------------------------------------------------------------
const LIVE_DOMAINS = ['18f.gov', 'gsa.gov', 'poolsafety.gov'];

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------
interface Args {
  outputPath?: string;
  live: boolean;
  includeHidden: boolean;
  domains: string[];
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  let outputPath: string | undefined;
  let live = false;
  let includeHidden = false;
  let domains: string[] = LIVE_DOMAINS;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && i + 1 < args.length) {
      outputPath = args[++i];
    } else if (args[i] === '--live') {
      live = true;
    } else if (args[i] === '--include-hidden') {
      includeHidden = true;
    } else if (args[i] === '--domains' && i + 1 < args.length) {
      domains = args[++i].split(',').map((d) => d.trim()).filter(Boolean);
    }
  }

  return { outputPath, live, includeHidden, domains };
}

// ---------------------------------------------------------------------------
// CSV writing helpers
// ---------------------------------------------------------------------------
function openCsvStream(columns: string[], outputPath?: string) {
  const outputStream = outputPath
    ? fs.createWriteStream(outputPath)
    : process.stdout;
  const csvStream = format({ headers: columns, rowDelimiter: '\r\n' });
  csvStream.pipe(outputStream);
  return csvStream;
}

async function finishCsvStream(
  csvStream: ReturnType<typeof format>,
  outputPath?: string,
) {
  csvStream.end();
  await new Promise((resolve) => csvStream.on('finish', resolve));
  if (outputPath) console.error(`CSV written to ${outputPath}`);
}

// ---------------------------------------------------------------------------
// Live mode (no DB)
// ---------------------------------------------------------------------------

/** Minimal NestJS module that wires up CoreScannerService without Postgres. */
@Module({
  imports: [BrowserModule, CoreScannerModule, LoggerModule.forRoot()],
})
class LiveScanModule {}

async function runLiveMode(
  domains: string[],
  columns: string[],
  includeHidden: boolean,
  outputPath?: string,
) {
  const app = await NestFactory.createApplicationContext(LiveScanModule, {
    logger: false,
  });
  const scanner = app.get(CoreScannerService);
  const csvStream = openCsvStream(columns, outputPath);

  for (let i = 0; i < domains.length; i++) {
    const domain = domains[i];
    console.error(`[${i + 1}/${domains.length}] Scanning ${domain}...`);

    const input: CoreInputDto = {
      websiteId: i + 1,
      url: domain,
      filter: false,
      pageviews: 0,
      visits: 0,
      scanId: `preview-${Date.now()}-${i}`,
    };

    try {
      const pages = await scanner.scan(input);
      const coreResult = buildCoreResult(i + 1, domain, pages);
      const website = buildWebsite(i + 1, domain, coreResult);
      csvStream.write(serializeRow(website, columns, includeHidden));
    } catch (err) {
      console.error(`  Error scanning ${domain}: ${err.message}`);
    }
  }

  await finishCsvStream(csvStream, outputPath);
  await app.close();
}

// ---------------------------------------------------------------------------
// DB mode (production-faithful)
// ---------------------------------------------------------------------------
async function runDbMode(
  columns: string[],
  includeHidden: boolean,
  outputPath?: string,
) {
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;

  if (!user || !password) {
    console.error('Error: POSTGRES_USER and POSTGRES_PASSWORD are required in DB mode.');
    console.error('');
    console.error('Usage:');
    console.error('  DATABASE_HOST=localhost DATABASE_PORT=5432 \\');
    console.error('  POSTGRES_USER=user POSTGRES_PASSWORD=pass \\');
    console.error('  DATABASE_NAME=postgres \\');
    console.error('  npx ts-node scripts/export-snapshot.ts [--include-hidden] [--output file.csv]');
    process.exit(1);
  }

  const host = process.env.DATABASE_HOST || 'localhost';
  const port = parseInt(process.env.DATABASE_PORT || '5432', 10);
  const database = process.env.DATABASE_NAME || 'postgres';
  const ssl = process.env.DATABASE_SSL !== 'false';

  const dataSource = new DataSource({
    type: 'postgres',
    host,
    port,
    username: user,
    password,
    database,
    ssl: ssl ? { rejectUnauthorized: false } : false,
    entities: [Website, CoreResult],
  });

  console.error(`Connecting to ${host}:${port}/${database}...`);

  try {
    await dataSource.initialize();
    console.error('Connected. Fetching data...');

    const websites = await dataSource
      .getRepository(Website)
      .createQueryBuilder('website')
      .innerJoinAndSelect('website.coreResult', 'coreResult')
      .orderBy({ 'coreResult.targetUrlBaseDomain': 'ASC', 'website.url': 'ASC' })
      .getMany();

    console.error(`Fetched ${websites.length} websites. Generating CSV...`);

    const csvStream = openCsvStream(columns, outputPath);
    for (const website of websites) {
      csvStream.write(serializeRow(website, columns, includeHidden));
    }
    await finishCsvStream(csvStream, outputPath);
    await dataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
async function main() {
  const { outputPath, live, includeHidden, domains } = parseArgs();
  const columns = buildColumnList(includeHidden);

  if (live) {
    console.error(
      `Live scan mode — domains: ${domains.join(', ')}${includeHidden ? ' [+hidden columns]' : ''}`,
    );
    await runLiveMode(domains, columns, includeHidden, outputPath);
  } else {
    console.error(
      `DB export mode${includeHidden ? ' [+hidden columns]' : ''}`,
    );
    await runDbMode(columns, includeHidden, outputPath);
  }
}

main();
