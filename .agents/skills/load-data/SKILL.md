---
name: load-data
description: Commands for loading and managing scan data — ingesting federal domains, enqueueing scans, running single-site tests, and exporting snapshots.
---

# Load Data Skill

Commands for working with scan data in the Site Scanning Engine.

## Prerequisites

- API and database must be running
- Infrastructure services (Docker) must be up

## Core Data Operations

### Ingest Federal Domain List

Load websites from Federal Website Index into the database:

```bash
npm run ingest -- --limit 200
```

**Options:**
- `--limit N` - Limit to N websites (recommended for local dev)
- Omit limit to ingest all domains (production use)

**Source:** https://github.com/GSA/federal-website-index/blob/main/data/site-scanning-target-url-list.csv

**Note:** This is a prerequisite for all scanning operations. Must be run before enqueueing scans.

### Enqueue All Websites for Scanning

Queue all websites in database for scanning:

```bash
npx nest start cli -- enqueue-scans
```

This adds jobs to the Redis queue for the scan-engine workers to consume.

### Scan Single Site (Testing)

Test scan a single site without writing to database:

```bash
npx nest start cli -- scan-site --url 18f.gov
```

**Use cases:**
- Testing scan logic locally
- Debugging specific site issues
- Validating scan configuration

**Note:** Results ARE persisted to the database. The URL must already exist in the `website` table (run ingest first).

### Create and Export Snapshot

Generate snapshot and export to S3:

```bash
npm run snapshot
```

**What this does:**
- Exports current scan results to CSV
- Uploads to S3/Minio for public consumption
- Only includes latest scan per website

**Note:** Snapshot generation is difficult to test locally because Minio configuration is limited in local dev. If issues occur, address them in the deployed environment.

## Data Flow

1. **Ingest** → Loads URLs into `website` table
2. **Enqueue** → Creates scan jobs in Redis queue
3. **Scan** → Workers process jobs, write to `core_result` table
4. **Snapshot** → Exports results to S3

## Database Notes

- Database stores only **most recent scan** per website (no historical data)
- Old scan results are overwritten with new ones
- Historical data is preserved via snapshots in S3

## Previewing a New Field Before Publishing

When a new scan field is added with `@Exclude()` (Phase 1 / hidden), use the
preview tools below to review how it will look in the snapshot before dropping
the `@Exclude()` in Phase 2.

### Quick preview — no Postgres required

Live-scan the default domains (18f.gov, gsa.gov, poolsafety.gov) and write a
CSV you can open locally:

```bash
# Public columns only (matches production snapshot)
npm run preview:csv -- --output tmp/preview.csv

# Include hidden/@Exclude()-ed columns (e.g. secondary_data_dates)
npm run preview:csv:hidden -- --output tmp/preview-hidden.csv

# Custom domain list
npm run preview:csv:hidden -- --domains "18f.gov,nasa.gov" --output tmp/preview.csv
```

Output goes to stdout if `--output` is omitted. The `tmp/` directory is
gitignored.

### CI gating — live e2e spec

Runs the full scan→map→serialize chain against the default domains and asserts
structural correctness (headers, key columns populated, hidden column
visibility):

```bash
npm run preview:e2e
```

This is also run via `npm run test:e2e` as part of the normal e2e suite.

### DB-backed export (production-faithful)

After running `ingest` + `scan-site` against local Postgres:

```bash
DATABASE_SSL=false POSTGRES_USER=postgres POSTGRES_PASSWORD=replace_me \
  npx ts-node -r tsconfig-paths/register scripts/export-snapshot.ts \
  --include-hidden --output tmp/preview-db.csv
```

### What `--include-hidden` does

Appends all `@Exclude()`-ed `@Expose()`-named columns after the public
`snapshotColumnOrder` so the public column order is never disturbed.
Hidden column names are maintained in `HIDDEN_EXPOSE_NAMES` in
`libs/snapshot/test/scan-to-csv.helper.ts`.

When a field is published (its `@Exclude()` is removed and it is added to
`snapshotColumnOrder`), remove it from `HIDDEN_EXPOSE_NAMES` — the unit test
`scan-to-csv.helper.spec.ts` will fail if a published column remains in that
list.
