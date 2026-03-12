---
editUrl: false
next: false
prev: false
title: "onCommand"
---

> **onCommand**\<`TSchema`\>(`contract`, `handler`, `options?`): [`CommandHandlerDeclaration`](/hoppity/api/interfaces/commandhandlerdeclaration/)

Defined in: [packages/hoppity/src/handlers/onCommand.ts:15](https://github.com/apogee-travel/hoppity/blob/e9908d31bdf13724b2a0a46d1d098f3a0fff92ad/packages/hoppity/src/handlers/onCommand.ts#L15)

Declares a typed command handler for use in the service config handlers array.

Same type-inference behavior as onEvent — the contract's schema drives the
handler's content type.

## Type Parameters

### TSchema

`TSchema` _extends_ `ZodTypeAny`

## Parameters

### contract

[`CommandContract`](/hoppity/api/interfaces/commandcontract/)\<`any`, `any`, `TSchema`\>

The CommandContract to handle

### handler

[`CommandHandler`](/hoppity/api/type-aliases/commandhandler/)\<`TSchema`\>

The handler function

### options?

[`HandlerOptions`](/hoppity/api/interfaces/handleroptions/)

Optional queue/redelivery/dead-letter overrides

## Returns

[`CommandHandlerDeclaration`](/hoppity/api/interfaces/commandhandlerdeclaration/)
