# How to Deploy Site-Scanner

Site-Scanner uses different deployment techniques, depending on where it will
be deployed. For deployments to the cloud.gov environment, several
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
root directory. This file includes parameters needed to start the
required services and for the Scan Engine to interact with them.

A sample configuration file is available in [sample.env](../sample.env)
with several `<add_a_key_here>` indicators. These need to be
replaced with actual keys. The file should be copied to `.env` (e.g.,
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

Deployments to the `dev` and `prod` Cloud Foundry spaces are handled by
GitHub Actions workflows -- there is no local deployment script.

- [`dev.yml`](../.github/workflows/dev.yml) deploys to the `dev` space using
  `manifest.yml` and `vars-dev.yml`. It runs automatically on every pull
  request to `main`, and can also be triggered manually from the Actions tab.
- [`deploy.yml`](../.github/workflows/deploy.yml) deploys to the `prod` space
  using `manifest.yml` and `vars-prod.yml`. It is triggered manually only.

To deploy to production, open the
[Deploy workflow](https://github.com/GSA/site-scanning-engine/actions/workflows/deploy.yml)
in the GitHub Actions tab and click **Run workflow** on the `main` branch.

Each workflow checks out the repository, installs dependencies
(`npm install`), builds all apps (`npm run build:all`), and then runs:

```bash
cf push -f manifest.yml --vars-file vars-<environment>.yml
```

against the corresponding org/space, authenticating with the `CF_USERNAME`
and `CF_PASSWORD` GitHub secrets.

### Configuration Files

`manifest.yml` describes the `site-scanner-api` and `site-scanner-consumer`
applications -- buildpacks, start commands, bound services, and resource
settings. Resource values (memory, disk, instance counts, schedules) are
templated with `((variable))` placeholders and supplied per-environment by
`vars-dev.yml` and `vars-prod.yml`. To change a resource setting (e.g., the
number of scan-engine workers), edit the relevant `vars-*.yml` file and let
the corresponding workflow deploy it.

### Inspecting a Deployed Environment

Logging in to Cloud.gov with the CLI is useful for monitoring and
troubleshooting, even though deploys themselves go through GitHub Actions:

```bash
cf login --sso
```

Be sure to target the correct organization and space (environment):

```bash
ORGANIZATION=gsatts-sitescan \
SPACE=dev \
cf target -o "$ORGANIZATION" -s "$SPACE"
```

To list the organizations and spaces you can access:

```bash
cf orgs
cf spaces
```

(note: you'll need to be authenticated in order for `cf orgs` or
`cf spaces` to work)

## Resources

Additional documentation is also available:

- [Environment Provisioning](environment_provisioning.md)
- [Development](development.md)
- [Project Layout](layout.md)
- [Architectural Diagrams](architecture/diagrams/images/architecture-cloud-gov.png)
