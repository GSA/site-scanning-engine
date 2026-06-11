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

**Note:** Results are printed to console but not persisted to database.

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
