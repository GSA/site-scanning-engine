#!/usr/bin/env ts-node

/**
 * Standalone script to export snapshot CSV directly from PostgreSQL database.
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
import { formatValue } from '@app/snapshot/serializers/csv-helpers';

// CSV_COLUMNS mirrors the public snapshot exactly.
//
// To preview a column that is still @Exclude()-ed from the public API/snapshot, splice its
// @Expose name into CSV_COLUMNS and populate it by hand from the raw entity value. E.g. for a
// comma-joined field exposed as `my_field_list`:
//
//   const base = CoreResult.snapshotColumnOrder;
//   const at = base.indexOf('some_neighbor_column');
//   const CSV_COLUMNS = [...base.slice(0, at + 1), 'my_field_list', ...base.slice(at + 1)];
//
// then inside the row loop (line ~120), before formatValue() runs:
//
//   const raw = website.coreResult.myField;
//   serialized.my_field_list = raw ? raw.split(',') : raw;
//
// Remove both once the field's @Exclude() is dropped — otherwise the column is emitted twice
// and the value is split on top of the entity's @Transform.
const CSV_COLUMNS = CoreResult.snapshotColumnOrder;

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
