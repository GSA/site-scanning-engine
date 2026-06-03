# Dev Workflow Skill

Common development commands and workflows for the Site Scanning Engine.

## Quick Reference

### Linting and Formatting

```bash
npm run lint        # ESLint with auto-fix
npm run format      # Prettier formatting
```

Run these before committing code.

### Testing

```bash
npm run test:unit   # Run all unit tests (excludes e2e)
npm run tdd         # Watch mode for test-driven development
npm run test:cov    # Run tests with coverage report
npm run test:e2e    # Run end-to-end tests only
```

**Note:** Test files use `.spec.ts` extension.

### Development Servers

```bash
npm run start:all   # Start all services (API + scan-engine)
npm run start:api   # Start API only (port 3000)
npm run start:scan-engine  # Start scan-engine worker only

npm run start:dev   # Start with watch mode (auto-reload on changes)
```

### Testing Scans

```bash
npm run scan:dev    # Test scan with watch mode (defaults to supremecourt.gov)
npm run scan:dap    # Test DAP scan specifically
```

For custom site:
```bash
npx nest start cli -- scan-site --url yourdomain.gov
```

### Building

```bash
npm run build:all   # Build all apps
npm run build:api   # Build API only
npm run build:scan-engine  # Build scan-engine only
npm run build:cli   # Build CLI only
```

## Docker Management

### Start Infrastructure

```bash
docker-compose up --build -d
```

Starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Minio (port 9000, 9001)

### Rebuild Containers (wipes data)

```bash
docker-compose up --build -d
```

**Warning:** This deletes all database and Redis data.

### Stop and Remove Containers

```bash
docker-compose down
```

### View Container Logs

```bash
docker-compose logs -f
docker-compose logs -f postgres  # Specific service
```

### Build Docker Image

```bash
docker build -f apps/scan-engine/Dockerfile .
```

**Note:** Docker is only for local dev - not used in production Cloud Foundry environment.

## Adding New Components

### New Application

```bash
nest g app <app_name>
```

Creates new app in `apps/` directory.

### New Library

```bash
nest g library <library_name>
```

Creates new library in `libs/` directory.

## Module Path Aliases

Configured in `tsconfig.json` and `package.json`:

```typescript
import { DatabaseModule } from '@app/database';
import { CoreScannerService } from '@app/core-scanner';
import { MessageQueueModule } from '@app/message-queue';
```

## Development Tips

### Watch Mode Best Practices

- Use `npm run start:dev` for rapid iteration
- Use `npm run tdd` for test-driven development
- Use `npm run scan:dev` for testing scan logic

### Before Committing

1. Run linter: `npm run lint`
2. Run formatter: `npm run format`
3. Run tests: `npm run test:unit`
4. Verify no TypeScript errors: `npm run build:all`

### Pre-commit Hooks

Configured in `.pre-commit-config.yaml` - automatically runs on git commit:
- Linting
- Formatting
- Basic validation

To skip hooks (not recommended):
```bash
git commit --no-verify
```

## API Development

### Swagger Documentation

Auto-generated API docs available at:
- http://localhost:3000/api-json (JSON spec)
- http://localhost:3000/api (Swagger UI - if configured)

Updates automatically when you add/modify endpoints.

### Database Migrations

In local development:
- TypeORM handles migrations automatically via entity decorators
- Migrations run when API starts
- No manual migration commands needed

## Troubleshooting

### Port Already in Use

Kill process using port:
```bash
lsof -ti:3000 | xargs kill -9  # API port
lsof -ti:6379 | xargs kill -9  # Redis port
```

### Node Version Issues

Ensure correct Node.js version:
```bash
nvm use  # Uses version from .nvmrc (24.x)
```

### Puppeteer Issues

Rebuild Puppeteer:
```bash
npm rebuild puppeteer
```

### Clean Slate

Full reset:
```bash
docker-compose down
rm -rf node_modules dist
npm i
npm run build:all
docker-compose up --build -d
npm run start:all
```
