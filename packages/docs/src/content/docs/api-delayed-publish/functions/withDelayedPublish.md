---
editUrl: false
next: false
prev: false
title: "withDelayedPublish"
---

> **withDelayedPublish**(`options`): `MiddlewareFunction`

Defined in: [packages/hoppity-delayed-publish/src/withDelayedPublish.ts:19](https://github.com/apogee-travel/hoppity/blob/44686f847069af050019409a7fbac4f4a8c27beb/packages/hoppity-delayed-publish/src/withDelayedPublish.ts#L19)

Middleware factory that adds delayed publish capabilities to a hoppity broker

This middleware:

1. Adds wait and ready queues to the topology
2. Configures dead letter exchange and bindings
3. Sets up publications for delayed messages
4. Extends the broker with delayedPublish method

## Parameters

### options

[`DelayedPublishOptions`](/hoppity/api-delayed-publish/interfaces/delayedpublishoptions/)

Configuration options for the delayed publish middleware

## Returns

`MiddlewareFunction`

A middleware function that can be used with hoppity
