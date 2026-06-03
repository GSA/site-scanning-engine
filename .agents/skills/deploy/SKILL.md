# Deploy Skill

Guide for deploying the Site Scanning Engine to Cloud.gov (Cloud Foundry).

## Important Notes

- Deployments are **manual** (no automated pipeline)
- Use `cf` CLI for all deployment and management tasks
- Web dashboard available for monitoring logs, but CLI is preferred for actual work

## Prerequisites

- Cloud Foundry CLI (`cf`) installed
- Cloud.gov account with appropriate permissions
- Access to the correct Cloud.gov space

## Deployment Process

### 1. Login to Cloud.gov

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

### 3. Deploy Application

Use the provided deployment script:

```bash
# Deploy using default manifest
./cloudgov-deploy.sh

# Deploy using alternate manifest (e.g., dev environment)
./cloudgov-deploy.sh manifest-dev.yml
```

## Configuration Files

### manifest.yml

Main Cloud Foundry manifest - defines:
- Application name
- Memory allocation
- Worker counts (7 scan-engine workers in production)
- Buildpacks
- Services to bind

### vars.yml (symlink)

Points to environment-specific variables:
- `vars.yml` → `vars-prod.yml` (production)
- `vars-dev.yml` (development)

Contains:
- API keys
- Service credentials
- Environment-specific configuration

## Post-Deployment Verification

### Check Application Status

```bash
cf apps
```

Look for:
- `api` - Should be running, 1 instance
- `scan-engine` - Should be running, 7 instances (production)

### View Recent Logs

```bash
cf logs <app-name> --recent
```

Example:
```bash
cf logs site-scan-api --recent
cf logs site-scan-engine --recent
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
cf scale site-scan-engine -i 7
```

### Scale Memory

```bash
cf scale <app-name> -m <memory>
```

Example:
```bash
cf scale site-scan-api -m 1G
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
- Ensure S3 credentials are correct in vars file

### Deployment Fails

- Check Cloud.gov status page
- Verify you have sufficient quota: `cf quotas`
- Review buildpack compatibility

## Important Reminders

- Docker is **only for local development** - not used in Cloud Foundry
- API must deploy successfully before scan-engine (database migrations)
- Always verify services are bound after deployment
- Keep vars.yml symlink pointing to correct environment file
