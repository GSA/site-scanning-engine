# Ingest Library

The [ingest](../libs/ingest) library is responsible for ingesting a list of
valid federal subdomains into the system.

## Configuration

The ingest library's [configuration file](https://github.com/GSA/site-scanning-engine/blob/main/libs/ingest/src/config/ingest.config.ts)
specifies a URL that points to a CSV file containing valid federal subdomains.

## Use

[The CLI's](../apps/cli) `ingest` command will retrieve data from the URL listed
in the ingest library's configuration file. CLI users can override the default
URL by passing a different `url` argument to the `ingest` command (e.g.,
`--url=<a_different_url>`).
