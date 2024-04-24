# Security Data Library

## Overview

This module is a [NestJS library](https://docs.nestjs.com/cli/libraries)
concerned with:

1. Fetching data regarding HTTPS good practices and saving it to the filesystem
2. Providing a gateway for the scan engine to access said data

## Configuration

The URL from which the security data library fetches security data is configured
in `./src/config/security-data.config.ts`.
