# Layout

The project is laid out into several related components. These
components can be thought of as either "applications" or "libraries".

## Applications

"Applications" have a `main.js` and are meant to be executables.
These are found in the [apps](../apps) directory.

The current applications are:

* [The Scan Engine](../apps/scan-engine) which listens to the message
  queue and routes work to the appropriate scanner.
* [The API](../apps/api) which is responsible for managing HTTPS
  access to the data.
* [The CLI](../apps/cli) which is a general purpose CLI for
  interacting with the site scanner components. Currently used to
  ingest the Target URLs that the site scanner uses, add scan jobs
  to the queue, clear the queue, and write scan snapshots to S3.

See each of the applications' `README.md`s for more info.

### Adding a new application

To add a new application, use the Nest.js CLI to scaffold the application.

```sh
nest g app <app_name>
```

## Libraries

"Libraries" have an `index.js` and are meant to be used by "Applications".
Anything that will be used by multiple "Applications" should likely be a
library.

The libraries are:

* [Browser](../libs/browser) which creates a headless browser for scanning.
* [Core Scanner](../libs/core-scanner) performs all of the basic scanning
  logic. See [Website Data](https://github.com/18F/site-scanning-documentation/blob/main/about/website-data.md)
  for more info.
* [Database](../libs/database) which is responsible for all data access.
* [Message Queue](../libs/message-queue) which is responsible for handling
  the message queue.
* [Ingest](../libs/ingest) which is responsible for ingesting data into
  the system. Currently, it handles target urls.

### Adding a new Library

To add a new library, use the Nest.js CLI to scaffold the library.

`nest g library <library_name>`
