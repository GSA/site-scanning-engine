# Site Scanning Two 

## Description
_Note: The project is a work in progress and APIs are unstable._

This repository is for the Site Scanning project. This is the new base scanner repository (a.k.a. Site Scanning Two) which uses Headless Chrome, powered by Puppeteer for scanning. 

The project is laid out into three related components: 

1) [The Site Scanner](./apps/scanner) which is responsible for scanning and scan logic. 
2) [The Data Layer](./apps/) which is responsible for storage and retrieval of data.
3) [The API](./apps/api) which is responsible for managing HTTPS access to the data.


## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```