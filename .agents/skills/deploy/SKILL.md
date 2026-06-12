---
name: deploy
description: Guide for deploying the Site Scanning Engine to Cloud.gov via GitHub Actions, and using the Cloud Foundry CLI to monitor and troubleshoot deployed environments.
---

# Deploy Skill

Guide for deploying the Site Scanning Engine to Cloud.gov (Cloud Foundry).

## Important Notes

- Deployments are handled by **GitHub Actions** workflows, not a local script or manual `cf push`
- Use `cf` CLI for monitoring and troubleshooting a deployed environment. Information on the Cloudfoundry CLI can be found at https://docs.cloudfoundry.org/cf-cli/. General advice on deployment with Cloudfoundry is at https://docs.cloudfoundry.org/devguide/deploy-apps/deploy-app.html 
- Web dashboard available for monitoring logs, but CLI is preferred for actual work

## Prerequisites

- Cloud Foundry CLI (`cf`) installed (for monitoring/troubleshooting)
- Cloud.gov account with appropriate permissions
- Access to the correct Cloud.gov space

## Deployment Process

Deployments are triggered via GitHub Actions:

- [`deploy.yml`](../../../.github/workflows/deploy.yml) deploys to the
  `prod` space using `manifest.yml` + `vars-prod.yml`. Triggered manually
  only (`workflow_dispatch`).
- [`dev.yml`](../../../.github/workflows/dev.yml) deploys to the `dev` space
  using `manifest.yml` + `vars-dev.yml`. Runs automatically on pull requests
  to `main`, and can also be triggered manually.

To trigger a deployment, run the workflow from the GitHub Actions tab (or
`gh workflow run deploy.yml` / `gh workflow run dev.yml`). Each workflow
installs dependencies, builds all apps, then runs
`cf push -f manifest.yml --vars-file <vars file>` using the `CF_USERNAME` /
`CF_PASSWORD` GitHub secrets.

### 1. Login to Cloud.gov (for monitoring/troubleshooting)

```bash
cf login -a api.fr.cloud.gov --sso
```

This will:
1. Open browser for SSO authentication
2. Provide a temporary code
3. Enter code in terminal to complete login

### 2. Verify Target Space

```bash
cf target
```

Ensure you're targeting the correct org and space.

## Configuration Files

### manifest.yml

Main Cloud Foundry manifest - defines:
- Application name
- Memory allocation
- Worker counts (7 scan-engine workers in production)
- Buildpacks
- Services to bind

### vars-prod.yml / vars-dev.yml

Environment-specific variables, passed to `cf push` via `--vars-file`:
- Instance counts, memory, disk
- Scan/snapshot schedules

### vars.yml (symlink)

Points to environment-specific variables:
- `vars.yml` → `vars-prod.yml` (production)

To change a resource setting (e.g., worker count or memory), edit the
relevant `vars-*.yml` file and deploy via the workflow above -- manual
`cf scale` changes will be reverted on the next deploy.

### vars.yml (symlink)

Points to environment-specific variables:
- `vars.yml` → `vars-prod.yml` (production)
- `vars-dev.yml` (development)

## Post-Deployment Verification

### Check Application Status

```bash
cf apps
```

Look for (instance counts come from `vars-prod.yml` / `vars-dev.yml`):
- `site-scanner-api`
- `site-scanner-consumer` - 7 instances in production

### View Recent Logs

```bash
cf logs <app-name> --recent
```

Example:
```bash
cf logs site-scanner-api --recent
cf logs site-scanner-consumer --recent
```

### Stream Live Logs

```bash
cf logs <app-name>
```

Press Ctrl+C to stop streaming.

## Managing Services

### List Bound Services

```bash
cf services
```

Shows:
- PostgreSQL database
- Redis queue
- S3 bucket

### View Environment Variables

```bash
cf env <app-name>
```

Example:
```bash
cf env site-scan-api
```

### Restart Application

```bash
cf restart <app-name>
```

### Restage Application (rebuild)

```bash
cf restage <app-name>
```

Use after:
- Buildpack updates
- Service binding changes

## Scaling

### Scale Instances

```bash
cf scale <app-name> -i <count>
```

Example:
```bash
cf scale site-scanner-consumer -i 7
```

### Scale Memory

```bash
cf scale <app-name> -m <memory>
```

Example:
```bash
cf scale site-scanner-api -m 1G
```

## Troubleshooting

### Application Won't Start

1. Check recent logs: `cf logs <app-name> --recent`
2. Verify services are bound: `cf services`
3. Check environment variables: `cf env <app-name>`
4. Review manifest.yml for configuration errors

### Connection Issues

- Verify PostgreSQL service is running
- Check Redis service status
- Verify the bound services have the expected credentials: `cf env <app-name>`

### Deployment Fails

- Check the failed step in the GitHub Actions run for `deploy.yml` / `dev.yml`
- Check Cloud.gov status page
- Verify you have sufficient quota: `cf quotas`
- Review buildpack compatibility

## Important Reminders

- Docker is **only for local development** - not used in Cloud Foundry
- API must deploy successfully before scan-engine (database migrations)
- Always verify services are bound after deployment
- Keep vars.yml symlink pointing to correct environment file
- Resource changes (memory, instance counts) belong in `vars-prod.yml` /
  `vars-dev.yml`, not ad-hoc `cf scale` calls, since the next deploy will
  reset them
