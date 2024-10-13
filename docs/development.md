# Development

The Site Scanning project is a Node.js microservice application that is
designed to run in Cloud.gov. The application currently uses all open
source components, so it is feasible to run the application locally.

## Environment Configuration

The project uses a `.env` file to configure the environment. This file
is not checked into the repository, so you will need to create one in
the root of the project. 

A `.env.example` file is provided. Simply copy that file to `.env`
and update any values as needed.

## Ancillary Services

The project leverages Docker and Docker Compose to "orchestrate"
service creation, networking and management.

Before running the ancillary services, check `docker-compose.yml`
to ensure that any relevant settings match those that you defined
in your `.env` file.

When ready, run the following:

```bash
docker-compose up --build
```

You should now have everything you need to run the application(s).

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

