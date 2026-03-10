---
editUrl: false
next: false
prev: false
title: "WithCustomLoggerOptions"
---

Defined in: [hoppity-logger/src/withCustomLogger.ts:7](https://github.com/apogee-travel/hoppity/blob/44686f847069af050019409a7fbac4f4a8c27beb/packages/hoppity-logger/src/withCustomLogger.ts#L7)

Configuration options for the [withCustomLogger](/hoppity/api-logger/functions/withcustomlogger/) middleware.

## Properties

### logger

> **logger**: [`Logger`](/hoppity/api-logger/interfaces/logger/)

Defined in: [hoppity-logger/src/withCustomLogger.ts:14](https://github.com/apogee-travel/hoppity/blob/44686f847069af050019409a7fbac4f4a8c27beb/packages/hoppity-logger/src/withCustomLogger.ts#L14)

The logger instance to inject into the middleware pipeline context.
Must implement all six methods of the [Logger](/hoppity/api-logger/interfaces/logger/) interface.
Most popular loggers (Winston, Pino, Bunyan) need a thin wrapper
since they typically lack `silly` and/or `critical` methods.
