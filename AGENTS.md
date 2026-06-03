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

### Prerequisites
- Node.js 24.x (use `nvm use` to switch to correct version)
- Docker and Docker Compose
- Redis CLI (optional)

### First-time Setup

1. Install dependencies:
```bash
npm i
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
# Edit .env and set passwords for POSTGRES_PASSWORD, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
```

3. Start infrastructure services:
```bash
docker-compose up --build -d
```

4. Build all applications:
```bash
npm run build:all
```

Or build individually:
```bash
npm run build:api
npm run build:scan-engine
npm run build:cli
```

5. Start applications:
```bash
npm run start:all
```

The API will start first and run database migrations, then the scan-engine worker will start. You can also start apps individually with `npm run start:api` or `npm run start:scan-engine`.

### Working with Data

Load federal domain list (required before scanning):
```bash
npm run ingest -- --limit 200
```

Enqueue all websites for scanning:
```bash
npx nest start cli -- enqueue-scans
```

Scan a single site (for testing, does not write to database):
```bash
npx nest start cli -- scan-site --url 18f.gov
```

Create snapshot and export to S3:
```bash
npm run snapshot
```

## Testing

Run all unit tests (excludes e2e):
```bash
npm run test:unit
```

Run tests in watch mode (TDD):
```bash
npm run tdd
```

Run with coverage:
```bash
npm run test:cov
```

Run e2e tests only:
```bash
npm run test:e2e
```

## Common Tasks

### Linting and Formatting
```bash
npm run lint        # ESLint with auto-fix
npm run format      # Prettier formatting
```

### Development Workflow
```bash
npm run start:dev              # Start with watch mode
npm run scan:dev               # Test scan with watch mode (defaults to supremecourt.gov)
npm run scan:dap               # Test DAP scan specifically
```

### Adding New Components

Add a new application:
```bash
nest g app <app_name>
```

Add a new library:
```bash
nest g library <library_name>
```

### Docker Management

Rebuild containers (wipes data):
```bash
docker-compose up --build -d
```

Stop and remove containers:
```bash
docker-compose down
```

Build application Docker image:
```bash
docker build -f apps/scan-engine/Dockerfile .
```

## Deployment

The application deploys to Cloud.gov using Cloud Foundry CLI:

1. Log in to Cloud.gov:
```bash
cf login -a api.fr.cloud.gov --sso
```

2. Deploy using the provided script:
```bash
./cloudgov-deploy.sh                  # Uses default manifest.yml
./cloudgov-deploy.sh manifest-dev.yml  # Uses alternate manifest
```

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

## Adding New Scans

To implement a new scan in the core-scanner:

1. Create a function in `libs/core-scanner/src/scans/` that takes a response or Puppeteer page object
2. Evaluate the DOM to extract desired data (see `uswds.ts` for example)
3. The `primary` scanner acts as parent - specific scans are children (sitemaps, USWDS checks, etc.)
4. Each scan function returns data that gets merged into the final result

## Adding New Fields/Columns

When prototyping new fields for scan results:

1. Add property to entity class (e.g., `entities/core-result.entity.ts`) with TypeORM decorators
2. Add `@Exclude()` decorator to hide from API during development
3. Test locally by generating a snapshot with the CLI - new column will appear in CSV
4. When ready for production:
   - Remove `@Exclude` decorator to expose in API
   - Update `static snapshot column order` in core-result entity
   - Update unit tests in snapshot library if needed

## Cloud Foundry / Cloud.gov

### Deployment
- Deployments are **manual** (no automated pipeline)
- Use `cf` CLI for all development tasks and service management
- Web dashboard available for monitoring logs but CLI is preferred for actual work

### Managing Services
```bash
cf login -a api.fr.cloud.gov --sso
cf services                    # List bound services
cf env <app-name>             # View environment variables
cf logs <app-name> --recent   # View recent logs
```

### Important Configuration Files
- `manifest.yml`: Main Cloud Foundry manifest
- `vars.yml` -> `vars-prod.yml` (symlink): Production variables
- `vars-dev.yml`: Development variables

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
