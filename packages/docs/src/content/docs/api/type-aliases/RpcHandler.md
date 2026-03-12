---
editUrl: false
next: false
prev: false
title: "RpcHandler"
---

> **RpcHandler**\<`TReq`, `TRes`\> = (`request`, `context`) => `Promise`\<`z.infer`\<`TRes`\>\>

Defined in: [packages/hoppity/src/handlers/types.ts:79](https://github.com/apogee-travel/hoppity/blob/e9908d31bdf13724b2a0a46d1d098f3a0fff92ad/packages/hoppity/src/handlers/types.ts#L79)

Handler for RPC operations. Must be async and return the response type.

## Type Parameters

### TReq

`TReq` _extends_ `ZodTypeAny`

The Zod schema for the request payload

### TRes

`TRes` _extends_ `ZodTypeAny`

The Zod schema for the response payload

## Parameters

### request

`z.infer`\<`TReq`\>

### context

[`HandlerContext`](/hoppity/api/interfaces/handlercontext/)

## Returns

`Promise`\<`z.infer`\<`TRes`\>\>
