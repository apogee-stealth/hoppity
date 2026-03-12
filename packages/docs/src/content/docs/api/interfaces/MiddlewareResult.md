---
editUrl: false
next: false
prev: false
title: "MiddlewareResult"
---

Defined in: [packages/hoppity/src/types.ts:125](https://github.com/apogee-travel/hoppity/blob/e9908d31bdf13724b2a0a46d1d098f3a0fff92ad/packages/hoppity/src/types.ts#L125)

Result object returned by middleware functions.
Contains the modified topology and optional callback for post-broker-creation actions.

MiddlewareResult

## Properties

### onBrokerCreated?

> `optional` **onBrokerCreated**: [`BrokerCreatedCallback`](/hoppity/api/type-aliases/brokercreatedcallback/)

Defined in: [packages/hoppity/src/types.ts:127](https://github.com/apogee-travel/hoppity/blob/e9908d31bdf13724b2a0a46d1d098f3a0fff92ad/packages/hoppity/src/types.ts#L127)

Optional callback to execute after broker creation

---

### topology

> **topology**: `BrokerConfig`

Defined in: [packages/hoppity/src/types.ts:126](https://github.com/apogee-travel/hoppity/blob/e9908d31bdf13724b2a0a46d1d098f3a0fff92ad/packages/hoppity/src/types.ts#L126)

The modified topology configuration
