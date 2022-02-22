# How to Deploy Site-Scanner

Site-Scanner uses different deployment techniques dased on where it will
be deployed.  For deployments to the cloud.gov environment, several
buildpacks are used (nodejs, apt); for local deployments, Docker (for
the application) and Docker-Compose (for required services) are used.

## Deploy to Local Environment

There are two components involved in deploying to a local
environment:

- Docker (for the application)
- Docker-Compose (for the required services)

### Deploy the Required Services in the Local Environment

A `docker-compose.yml` file is provided to standup the required services
in the local environment.

#### Configure The Required Services

First, a configuration file, `.env` must be created in the project's
root directory.  This file includes parameters needed to start the
required services and for the Scan Engine to interact with them.

A sample configuration file is available in [../sample.env](sample.env)
with serveral `<add_a_key_here>` indicators.  These need to be
replaced with actual keys.  The file should be copied to `.env` (e.g.,
`cp sample.env .env`), not moved or updated in-place.

The actual values used to replace the `<add_a_key_here>` are largely
irrelevant -- their value doesn't matter so just pick something.

- **Note**: this file does not affect cloud.gov or the environments hosted
  there (e.g., development or production); it only applies to the
  local environment.

#### Bringing Up The Required Services

After -- and only after -- a `.env` file is provided, the
`docker-compose` command may be used to instantiate the required
services:

```bash
( cd "$(git rev-parse --show-toplevel" \
  && docker-compose up \
    --detach
)
```

### Deploy the Scan Engine to the Local Environment

The application may be built using the `docker build` command:

```bash
( cd "$(git rev-parse --show-toplevel)" \
  && docker build \
    -t scan-engine \
    -f apps/scan-engine/Dockerfile \
    .
)
```

In the above example, the resulting image is tagged "scan-engine" so
that we can reference the image when running it:

```bash
docker run \
  --rm \
  --interactive \
  --tty
  scan-engine
```

- **Note**: we'll need to have the required services (Postgres, Redis, Minio)
  configured and running in order for the Scan Engine to start and
  function properly.

## Deploy to Development Environment

## Deploy to Production Environment
