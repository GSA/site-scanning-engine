---
name: setup
description: Guide through initial development setup of the Site Scanning Engine (prerequisites, Docker, building, first data load).
---

# Setup Skill

Guide user through initial development setup of the Site Scanning Engine.

## Prerequisites Check

First verify prerequisites are installed:
- Node.js 24.x (use `nvm use` to switch to correct version)
- Docker and Docker Compose
- Redis CLI (optional)

## Setup Steps

### 1. Install Dependencies
```bash
npm i
```

### 2. Environment Configuration
Create `.env` file from template:
```bash
cp .env.example .env
```

**IMPORTANT**: Edit `.env` and set passwords for:
- `POSTGRES_PASSWORD`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

### 3. Start Infrastructure Services
```bash
docker-compose up --build -d
```

This starts:
- PostgreSQL database
- Redis queue
- Minio (S3-compatible storage)

### 4. Build Applications

Build all at once:
```bash
npm run build:all
```

Or build individually:
```bash
npm run build:api
npm run build:scan-engine
npm run build:cli
```

### 5. Start Applications

```bash
npm run start:all
```

The API will start first and run database migrations, then the scan-engine worker will start.

You can also start apps individually:
- `npm run start:api`
- `npm run start:scan-engine`

### 6. Load Initial Data

Before scanning, you must load the federal domain list:
```bash
npm run ingest -- --limit 200
```

This ingests websites into the database (limit to 200 for local dev).

## Verification

Check that services are running:
```bash
docker-compose ps
```

API should be accessible at http://localhost:3000

## Common Issues

- If API fails to start, check PostgreSQL is running in Docker
- If scan-engine can't connect to queue, verify Redis is running
- If builds fail, ensure you're using Node.js 24.x (`nvm use`)
