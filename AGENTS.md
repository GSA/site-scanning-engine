# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Site Scanning Engine is a Node.js microservice application that uses Headless Chrome (Puppeteer) to scan federal government websites and collect data about accessibility, performance, security, and compliance. The application is designed to run on Cloud.gov but can be developed locally using Docker.

## Understanding the Codebase

**Recommended approach**: Start with GitHub Actions workflows in `.github/workflows/` and work backwards to understand how the system operates. The workflows show the actual commands being run in production, which you can trace back through the CLI to the underlying services and libraries.

For example:
1. Look at `.github/workflows/ingest.yml` - shows `nest start cli -- ingest` command
2. Trace to `apps/cli/src/` to find the ingest command implementation
3. Follow to `libs/ingest/` to see the actual ingestion logic
4. Continue to `libs/database/` and `entities/` to understand data storage

This "follow the execution path" approach is more effective than trying to understand the architecture from the bottom up.

## Architecture

This is a NestJS monorepo with three applications and multiple shared libraries:

### Applications (`apps/`)

- **api**: REST API for accessing scan data (port 3000). Manages database schema and serves data via HTTP endpoints with Swagger documentation.
- **scan-engine**: Worker process that consumes jobs from Redis queue and executes scans using Puppeteer.
- **cli**: Command-line tool for administrative tasks (ingesting URLs, enqueuing scans, creating snapshots).

### Libraries (`libs/`)

- **core-scanner**: Core scanning logic with two main concepts:
  - **Pages** (`libs/core-scanner/src/pages/`): Different page types to scan (primary, robots.txt, sitemap.xml, DNS, accessibility, performance, www, notFound, clientRedirect)
  - **Scans** (`libs/core-scanner/src/scans/`): Specific analyses performed on pages (DAP, CMS, cookies, USWDS, SEO, login, search, third-party services, tooling, required-links, feedback-links, mobile, url-scan)
- **browser**: Manages Puppeteer browser instances and page pools for scanning
- **database**: TypeORM integration and data access layer
- **message-queue**: Bull/Redis queue management for job processing
- **ingest**: Ingests federal domain lists from external sources
- **storage**: S3/Minio integration for storing scan snapshots
- **snapshot**: Creates and manages scan snapshots exported to S3
- **datetime**: Date/time utilities
- **security-data**: Security-related data handling
- **logging**: Pino-based structured logging
- **queue**: Queue utilities

### Entities (`entities/`)

TypeORM entities define the database schema:
- `core-result.entity.ts`: Main scan results table
- `website.entity.ts`: Target URLs to scan
- `scan-data.entity.ts`: Base scan data structure
- `scan-page.entity.ts`: Page-level scan data
- `scan-status.ts`: Scan execution status tracking

## Development Setup

For first-time setup instructions, use the `/setup` skill.

For data loading commands (ingest, enqueue, scan), use the `/load-data` skill.

For common development workflows, use the `/dev-workflow` skill.

For deployment instructions, use the `/deploy` skill.

## Key Technical Details

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL (via TypeORM)
- **Queue**: Redis with Bull (7 workers in production)
- **Browser**: Puppeteer for headless Chrome scanning
- **Storage**: S3-compatible (Minio locally, S3 in production)
- **Logging**: Structured JSON logging with Pino
- **API Docs**: Swagger/OpenAPI auto-generated at `/api-json`
- **Cloud.gov Configuration**: `manifest.yml` and `vars.yml` files configure Cloud Foundry resources including memory allocation and worker counts

## Scan Execution Flow

### Automated Production Schedule

The production system runs automated workflows via GitHub Actions:

- **URL Ingestion**: Daily at 22:15 UTC - ingests federal domain list from Federal Website Index repository
- **Scan Queueing**: Monday, Wednesday, Friday at 00:00 UTC - queues all websites for scanning

### Scanning Process

1. Federal Website Index repository provides source URL list
2. CLI ingests URLs into `website` table (prerequisite for all scanning)
3. CLI enqueues scan jobs to Redis queue
4. Seven scan-engine workers consume jobs from queue
5. Each job uses core-scanner to:
   - Launch Puppeteer browser from pool
   - Visit different pages (primary, robots.txt, sitemap.xml, etc.)
   - Run various scans (accessibility, DAP, USWDS, etc.)
   - Collect results
6. Results stored in `core_result` table (only latest scan per website)
7. Snapshots exported to S3 for public consumption

### Database Design

- Database stores only the **most recent scan results** per website (no historical data)
- Migrations are handled automatically in local dev via TypeORM entity decorators
- Object Relational Mapper maintains separation between business logic and data storage

## Extending the Scanner

To implement a new scan, use the `/add-scan` skill.

To add new fields/columns to scan results, use the `/add-field` skill.

## Federal Website Index Integration

The federal domain list comes from a **separate repository**: [GSA/federal-website-index](https://github.com/GSA/federal-website-index)

The Federal Website Index is a Python-based system that:
- Generates the target URL list **nightly** and publishes to: https://github.com/GSA/federal-website-index/blob/main/data/site-scanning-target-url-list.csv
- This CSV file is what the scan engine ingests via the daily ingest workflow (22:15 UTC)
- Evolved from manual process to automated, well-engineered architecture
- Uses distinct `source list` classes to handle data preparation and cleaning from disparate datasets
- Main routine assembles data, tracks metadata via analysis object, and creates final CSV output
- Output includes base domain, agency, and bureau information
- Adding new data sources requires creating a new source list class and integrating into main builder routine

## Known Issues and Limitations

- Snapshot generation is difficult to test locally because Minio is not configured for local dev
- If snapshot issues occur, they are typically addressed in the deployed environment rather than locally
- Docker/docker-compose is **only for local development** - not used in production Cloud Foundry environment
- Test snapshot generation using local CLI tool when adding new columns

## Important Notes

- The scan-engine uses a browser pool to manage Puppeteer instances efficiently
- API must start before scan-engine to ensure database schema is initialized
- Local development uses Minio (S3-compatible storage) instead of AWS S3
- Test files use `.spec.ts` extension
- Module path aliases are configured in `tsconfig.json` and `package.json` (e.g., `@app/database`, `@app/core-scanner`)
- Application is generally stable in production with automated daily operations
