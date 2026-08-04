#!/usr/bin/env ts-node

/**
 * Standalone script to export snapshot CSV directly from PostgreSQL database.
 * Includes the uswds_usa_elements_list field which is excluded from the public API/snapshot.
 *
 * Usage:
 *   npx ts-node scripts/export-snapshot.ts [--output path/to/file.csv]
 *
 * Environment variables:
 *   DATABASE_HOST (default: localhost)
 *   DATABASE_PORT (default: 5432)
 *   POSTGRES_USER (required)
 *   POSTGRES_PASSWORD (required)
 *   DATABASE_NAME (default: postgres)
 *   DATABASE_SSL (default: true)
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { format } from '@fast-csv/format';
import * as fs from 'fs';
import * as process from 'process';
import { CoreResult } from '../entities/core-result.entity';
import { Website } from '../entities/website.entity';
import { formatValue } from '../libs/snapshot/src/serializers/csv-helpers';

// Derive column order from the canonical CoreResult.snapshotColumnOrder with
// uswds_usa_elements_list added after uswds_usa_classes (this field is @Exclude()-ed
// from the public API/snapshot, which is why this script exists).
const base = CoreResult.snapshotColumnOrder;
const insertAt = base.indexOf('uswds_usa_classes');
const CSV_COLUMNS = [
  ...base.slice(0, insertAt + 1),
  'uswds_usa_elements_list',
  ...base.slice(insertAt + 1),
];

/**
 * Parses command line arguments.
 */
function parseArgs(): { outputPath?: string } {
  const args = process.argv.slice(2);
  let outputPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && i + 1 < args.length) {
      outputPath = args[i + 1];
      i++;
    }
  }

  return { outputPath };
}

async function main() {
  const { outputPath } = parseArgs();

  // Validate required env vars
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;

  if (!user || !password) {
    console.error(
      'Error: POSTGRES_USER and POSTGRES_PASSWORD environment variables are required.',
    );
    console.error('');
    console.error('Usage:');
    console.error('  DATABASE_HOST=localhost DATABASE_PORT=5432 \\');
    console.error('  POSTGRES_USER=user POSTGRES_PASSWORD=pass \\');
    console.error('  DATABASE_NAME=postgres \\');
    console.error('  npx ts-node scripts/export-snapshot.ts [--output file.csv]');
    process.exit(1);
  }

  // Build connection config
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
      .orderBy({
        'coreResult.targetUrlBaseDomain': 'ASC',
        'website.url': 'ASC',
      })
      .getMany();

    console.error(`Fetched ${websites.length} websites. Generating CSV...`);

    const outputStream = outputPath
      ? fs.createWriteStream(outputPath)
      : process.stdout;

    const csvStream = format({
      headers: CSV_COLUMNS,
      rowDelimiter: '\r\n',
    });

    csvStream.pipe(outputStream);

    for (const website of websites) {
      const serialized = website.serialized();

      // Manually add the uswds_usa_elements_list field which is excluded from public serialization.
      // We split it here so that formatValue() can handle it as an array (JSON-stringifying it).
      const rawElements = website.coreResult.usaElementsUsed;
      serialized.uswds_usa_elements_list =
        rawElements && rawElements !== '' ? rawElements.split(',') : rawElements;

      const formatted = {};
      for (const key of CSV_COLUMNS) {
        formatted[key] = formatValue(serialized[key]);
      }
      csvStream.write(formatted);
    }

    csvStream.end();

    await new Promise((resolve) => csvStream.on('finish', resolve));

    if (outputPath) {
      console.error(`CSV written to ${outputPath}`);
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
