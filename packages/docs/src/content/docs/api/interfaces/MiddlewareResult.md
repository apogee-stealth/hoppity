---
editUrl: false
next: false
prev: false
title: "MiddlewareResult"
---

Defined in: [types.ts:129](https://github.com/apogee-travel/hoppity/blob/92dd3ed3d1710ba1cd8ef54676c083a56ebc1a98/packages/hoppity/src/types.ts#L129)

Result object returned by middleware functions.
Contains the modified topology and optional callback for post-broker-creation actions.

MiddlewareResult

## Properties

### onBrokerCreated?

> `optional` **onBrokerCreated**: [`BrokerCreatedCallback`](/hoppity/api/type-aliases/brokercreatedcallback/)

Defined in: [types.ts:131](https://github.com/apogee-travel/hoppity/blob/92dd3ed3d1710ba1cd8ef54676c083a56ebc1a98/packages/hoppity/src/types.ts#L131)

Optional callback to execute after broker creation

---

### topology

> **topology**: `BrokerConfig`

Defined in: [types.ts:130](https://github.com/apogee-travel/hoppity/blob/92dd3ed3d1710ba1cd8ef54676c083a56ebc1a98/packages/hoppity/src/types.ts#L130)

The modified topology configuration
