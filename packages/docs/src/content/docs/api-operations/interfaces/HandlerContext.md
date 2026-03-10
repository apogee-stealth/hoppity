---
editUrl: false
next: false
prev: false
title: "HandlerContext"
---

Defined in: [packages/hoppity-operations/src/types.ts:15](https://github.com/apogee-travel/hoppity/blob/44686f847069af050019409a7fbac4f4a8c27beb/packages/hoppity-operations/src/types.ts#L15)

Context object passed to every handler invocation.
Gives handlers access to the extended broker for outbound operations
(e.g., publishing follow-up events from within a command handler).

## Properties

### broker

> **broker**: [`OperationsBroker`](/hoppity/api-operations/interfaces/operationsbroker/)

Defined in: [packages/hoppity-operations/src/types.ts:16](https://github.com/apogee-travel/hoppity/blob/44686f847069af050019409a7fbac4f4a8c27beb/packages/hoppity-operations/src/types.ts#L16)
