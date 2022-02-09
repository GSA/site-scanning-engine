# Scanner

This directory contains the source and documentation for the
`Scanner` component of the Site-Scanning application.

Also see the `Core Scanner` component:
[Core-Scaner](../../libs/core-scanner)
.

## Scan Engine

The Scan Engine provides interfaces for calling the Scanners.
The Scan Engine consumes a Redis message queue using `bull`,
and pulls work off of the queue and routes it to the correct
scanner using the `ScanEngineController`.

## Scanners

The `Scanners` directory stores useful common code for scanning,
and the individual scanners that the Scan Engine routes work to.
Of particular note is the `Scanner` interface (`scanner.interface.ts`)
and the `BrowserFactoryProvider` (`browser.provider.ts`). When
creating a new scanner, it should implement the `Scanner` interface
so that the `Scan Engine` component can correctly route requests
to it. The `BrowserFactoryProvider` provides a headless scanner
(using the `Puppeteer` project). Note that this is an asynchronous
provider, so it must be provided using the `@Inject()` decorator.
There is no requirement to use the `BrowserFactoryProvider`,
for example, a new scanner could use `axios` for all of its
scanning needs.

### Core

The `CoreScanner` is a headless scanner (meaning it depends
on the `BrowserFactoryProvider`). The CoreScanner provides
all of the information that we would like to know about a
particular website in the Federal web presence.

:TODO Add the fields that the CoreScanner looks for.

## Local Development

### Node.js

Development on the `Scanner` component can be done using
Node.js. Follow the directions in the
[root README.md](../../README.md#installation)
.

### Docker

To test the entire Site Scanning ecosystem locally,
`docker` is required.

**NOTE**: we are not using Docker in production, only for local
E2E testing.

**Note**, that all sorts of "interesting" things are required
to get the `Puppeteer` project to run in Docker:

1. The [Dockerfile](./Dockerfile) requires installing
   Chrome's dependencies for Debian systems. See
   [this documentation](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-in-docker)
   for more details.

1. Even with the dependencies installed, Chrome cannot
   create a sandbox because of how `Docker` limits the
   syscall interface. This
   [fascinating blog post](https://blog.jessfraz.com/post/how-to-use-new-docker-seccomp-profiles/)
   by Jessie Frazelle provides a solution based on
   monitoring the syscalls that Chrome uses. From that
   monitoring, an
   [allow-list of syscalls](https://github.com/jessfraz/dotfiles/blob/master/etc/docker/seccomp/chrome.json)
   is created.

Our application uses this as follows:

```sh
docker run --security-opt seccomp=apps/scanner/chrome.json <container-tag>
```

This can also be passed in the `docker-compose` file as follows:

```yaml
services:
  desktop:
    security_opt:
      - seccomp:"./chrome.json"
```
