---
editUrl: false
next: false
prev: false
title: "EventContracts"
---

> **EventContracts**\<`TDomain`, `TEvents`\> = `{ [K in keyof TEvents]: EventContract<TDomain, K & string, TEvents[K]> }`

Defined in: [types.ts:116](https://github.com/apogee-travel/hoppity/blob/44686f847069af050019409a7fbac4f4a8c27beb/packages/hoppity-contracts/src/types.ts#L116)

Maps an EventsDefinition record to its corresponding EventContract types.
Used to produce the typed `events` property on a DomainDefinition.

## Type Parameters

### TDomain

`TDomain` _extends_ `string`

### TEvents

`TEvents` _extends_ [`EventsDefinition`](/hoppity/api-contracts/type-aliases/eventsdefinition/)
