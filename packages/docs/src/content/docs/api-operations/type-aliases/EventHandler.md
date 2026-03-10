---
editUrl: false
next: false
prev: false
title: "EventHandler"
---

> **EventHandler**\<`TSchema`\> = (`content`, `context`) => `Promise`\<`void`\> \| `void`

Defined in: [packages/hoppity-operations/src/types.ts:29](https://github.com/apogee-travel/hoppity/blob/44686f847069af050019409a7fbac4f4a8c27beb/packages/hoppity-operations/src/types.ts#L29)

Handler for domain events. May be sync or async — auto-acked on success.

## Type Parameters

### TSchema

`TSchema` _extends_ `ZodTypeAny`

The Zod schema from the EventContract

## Parameters

### content

`z.infer`\<`TSchema`\>

### context

[`HandlerContext`](/hoppity/api-operations/interfaces/handlercontext/)

## Returns

`Promise`\<`void`\> \| `void`
