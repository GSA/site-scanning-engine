# Site Scanning Two 

## Description
_Note: The project is a work in progress and APIs are unstable._

This repository is for the Site Scanning project. This is the new base scanner repository (a.k.a. Site Scanning Two) which uses Headless Chrome, powered by Puppeteer for scanning. 

For more detailed documentation about the Site Scanning program, including **who it's for**, **long-term goals**, and **how you can help** please visit the [Site Scanning Documentation Repository] (https://github.com/18F/site-scanning-documentation).


## Table of Contents

1. [Quickstart](#quickstart)

    a. [Installation](#Installation)

    b. [Dotenv](#Dotenv)

    c. [Docker](#Docker)

    d. [Start all Apps](#start-all-apps)

    e. [Test](#test)

2. [Development Documentation](./docs)

    a. [Project Layout](./docs/layout.md)

    b. [Detailed Development](./docs/development.md)

    c. [Architecture](./docs/architecture/README.md)


## Quickstart

Development Requirements: 
`nodejs` and `nvm` (see [.nvmrc](./.nvmrc) for current `node` version.

`docker` and `docker-compose`

### Installation
From the project root run:

```bash
$ npm install
```

### Dotenv
The project uses a dotenv (`.env`) file for local development credentials. Note that this file is not version-controlled and should only be used for local development.

Before starting Docker, create a `.env` file in the project root and add the following values replacing `<add a password here>>` with a local development password: 

```
DATABASE_HOST=localhost
DATABASE_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<add a password here>
QUEUE_HOST=localhost
QUEUE_PORT=6379
```

### Docker
From the project root run:

```
docker-compose up --build
```

### Start all apps
From the project root run:

```bash
# development
$ npm run start:all
```

## Test
From the project root run:

```bash
# unit tests
$ npm run test
```