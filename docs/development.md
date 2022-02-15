# Development

The Site Scanning project is a Node.js microservice application that is
designed to run in Cloud.gov. The application currently uses all open
source components, so it is feasible to run the application locally.

## Docker and Docker Compose

The project leverages Docker and Docker Compose to "orchestrate"
service creation, networking and management.

The current recommendation is to run `docker-compose up --build`
and then `npm start:all`. This will start a `postgres` instance
and a `redis` instance. Note that a `.env` file is required in
the project root for local development credentials.

The Node.js apps are configured to connect to the Docker-provided
versions of the services when running locally, and the Cloud.gov
provided versions when running in Cloud.gov. See the
[Database Config](../libs/database/src/config/db.config.ts)
for an example of how this is set up.

## Dockerfiles

Each of the apps contains a `Dockerfile` should you choose to
run the entire application in Docker-compose or adapt the
application to be container-based.

In order to run everything in Docker, update the `docker-compose.yml`
to look like the following:

```yaml
---
version: "3.8"
services:
    api:
        build:
            context: "."
            dockerfile: "./apps/api/Dockerfile"
            target: development
        volumes:
            - .:/usr/src/app
            - /usr/src/app/node_modules
        ports:
            - "3000:3000"
        command: npm run start:dev api
        networks:
            - webnet
        depends_on:
            - postgres


    cli:
        build:
            context: "."
            dockerfile: "./apps/scan-engine/Dockerfile"
            target: development
        volumes:
            - .:/usr/src/app
            - /usr/src/app/node_modules
        command: bash
        environment:
            - QUEUE_HOST=redis
        security_opt:
            - "seccomp=./apps/scan-engine/chrome.json"
        networks:
            - webnet
        depends_on:
            - redis
            - postgres

    postgres:
        container_name: postgres
        image: postgres:13
        env_file:
            - .env
        ports:
            - "5432:5432"
        networks:
            - webnet

    redis:
        container_name: redis
        image: redis:5
        ports:
            - "6379:6379"
        networks:
            - webnet

networks:
    webnet:
```

## Starting the Apps

Here are some common commands. See the [package.json](../package.json) for all options.

```bash

# start all apps
npm run start:all

# start a single app, where <app_name> is one of scanner or api
npm run start:<app_name>

# start an app and live-reload
npm run start:dev <app_name>
```

## Testing

Here are some common commands. See the [package.json](../package.json) for all options.

```bash

# test all
npm run test

# test with no end-to-end tests
npm run test:no-e2e

# test with only end-to-end tests
npm run test:e2e

# test with coverage
npm run test:cov

# re-run tests when code changes
npm run test:watch

# lint
npm run lint
```
