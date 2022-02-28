# How to Deploy Site-Scanner

Site-Scanner uses different deployment techniques, depending on where it will
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

A sample configuration file is available in [sample.env](../sample.env)
with several `<add_a_key_here>` indicators.  These need to be
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
    --build \
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

- **Note**: the required services (Postgres, Redis, Minio) must be
  configured and running in order for the Scan Engine to start and
  function properly.

## Deploy to Cloud.gov (development, production, etc.)

Deploying to the development environment (and production) is different
because development (and production) is (are) hosted remotely on
cloud.gov infrastructure.

The first step is to login to the cloud.gov infrastructure with a
valid session token:

```bash
cf login --sso
```

Be sure to target the correct organization and space (environment)
so that updates are pushed to the correct service:

```bash
ORGANIZATION=the_organization \
SPACE=the_space \
cf target -o "$ORGANIZATION" -s "$SPACE"
```

Here, `$ORGANIZATION` and `$SPACE` are the orgnization and space,
respectively.  To list the organizations one may access, use:

```bash
cf orgs
```

...and to list spaces, use:

```bash
cf spaces
```

(note: you'll need to be authenticated in order for `cf orgs` or
`cf spaces` to work)

Then, use the `cloudgov-deploy.sh` script to push the changes to the
desired space (environment):

```bash
( cd "$(git rev-parse --show-toplevel)" \
  && ./cloudgov-deploy.sh
)
```

The `cloudgov-deploy.sh` is a wrapper around running `cf push`
that will push the code on the filesystem -- regardless of any
git branches, Pull Requests (PRs), commits, etc. -- out to the
cloud.gov infrastructure.  Also, the script has functionality
to verify that the required services are setup and running
on the cloud.gov infrastructure, such as an S3 bucket,
Redis queue, Postgres database, API key, etc..

The file used to configure and deploy the application is an
environment-specific YAML file, typically named of the form
`manifest-(environment).yml` (replace '`(environment)`' with the name
of the actual environment.

When `cloudgov-deploy.sh` is run in a new environment, it
will prompt the operator for an API key.  This API key is stored on
cloud.gov as an environment variable that can be used by applications.
As a result, one doesn't need to retain the API key or store it
anywhere.

- **Note:** the process of standing up a new environment takes
   about 20 minutes to complete.  This is normal.

## Resources

Additional documentation is also available:

- [Environment Provisioning](environment_provisioning.md)
- [Development](development.md)
- [Project Layout](layout.md)
- [Architectural Diagrams](architecture/diagrams/images/architecture-cloud-gov.png)
