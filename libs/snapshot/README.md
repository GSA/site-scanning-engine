# Snapshot Library

## Overview

This module is a [NestJS library](https://docs.nestjs.com/cli/libraries)
concerned with:

1. Creating CSV and JSON "snapshots" of data that the scan engine produces
2. Uploading those snapshots to a publically accessible S3 bucket

## Configuration

The filenames that the snapshot library uses for each snapshot are configured
in `./src/config/snapshot.config.ts`.
