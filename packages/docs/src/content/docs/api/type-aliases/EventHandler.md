---
editUrl: false
next: false
prev: false
title: "EventHandler"
---

> **EventHandler**\<`TSchema`\> = (`content`, `context`) => `Promise`\<`void`\> \| `void`

Defined in: [packages/hoppity/src/handlers/types.ts:60](https://github.com/apogee-travel/hoppity/blob/e9908d31bdf13724b2a0a46d1d098f3a0fff92ad/packages/hoppity/src/handlers/types.ts#L60)

Handler for domain events. May be sync or async — auto-acked on success.

## Type Parameters

### TSchema

`TSchema` _extends_ `ZodTypeAny`

The Zod schema from the EventContract

## Parameters

### content

`z.infer`\<`TSchema`\>

### context

[`HandlerContext`](/hoppity/api/interfaces/handlercontext/)

## Returns

`Promise`\<`void`\> \| `void`
