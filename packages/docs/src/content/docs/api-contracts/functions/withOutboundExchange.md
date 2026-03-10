---
editUrl: false
next: false
prev: false
title: "withOutboundExchange"
---

> **withOutboundExchange**(`serviceName`): `MiddlewareFunction`

Defined in: [withOutboundExchange.ts:22](https://github.com/apogee-travel/hoppity/blob/44686f847069af050019409a7fbac4f4a8c27beb/packages/hoppity-contracts/src/withOutboundExchange.ts#L22)

Middleware factory that inserts a per-service fanout outbound exchange.

Why: A fanout outbound exchange lets you tap all outbound messages for a
service in one place (audit, metrics, replay) without changing domain exchange
topology. Publishers write to the outbound; the outbound fans to domain exchanges.

What it does per vhost:

1.  Creates {serviceName}\_outbound (fanout, durable)
2.  Scans all publications for the set of unique domain exchange names
3.  For each unique exchange, adds an exchange-to-exchange binding:
    source: outbound → destination: domain exchange
4.  Rewrites each publication's exchange to point at the outbound

Subscriptions and inbound queue bindings are untouched — this is a
publisher-side concern only.

## Parameters

### serviceName

`string`

## Returns

`MiddlewareFunction`
