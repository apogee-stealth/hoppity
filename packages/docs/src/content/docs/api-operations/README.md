---
editUrl: false
next: false
prev: false
title: "@apogeelabs/hoppity-operations"
---

## Example

```typescript
import { withOperations, onEvent, onRpc } from "@apogeelabs/hoppity-operations";

const broker = await hoppity
    .withTopology(topology)
    .use(withOperations({
        serviceName: "warehouse",
        instanceId: crypto.randomUUID(),
        handlers: [
            onEvent(Order.events.placed, async (content) => { ... }),
            onRpc(Inventory.rpc.check, async (req) => { ... }),
        ],
    }))
    .build() as OperationsBroker;
```

## Interfaces

- [CommandHandlerDeclaration](/hoppity/api-operations/interfaces/commandhandlerdeclaration/)
- [EventHandlerDeclaration](/hoppity/api-operations/interfaces/eventhandlerdeclaration/)
- [HandlerContext](/hoppity/api-operations/interfaces/handlercontext/)
- [OperationsBroker](/hoppity/api-operations/interfaces/operationsbroker/)
- [OperationsMiddlewareOptions](/hoppity/api-operations/interfaces/operationsmiddlewareoptions/)
- [RpcHandlerDeclaration](/hoppity/api-operations/interfaces/rpchandlerdeclaration/)
- [RpcRequest](/hoppity/api-operations/interfaces/rpcrequest/)
- [RpcResponse](/hoppity/api-operations/interfaces/rpcresponse/)

## Type Aliases

- [CommandHandler](/hoppity/api-operations/type-aliases/commandhandler/)
- [EventHandler](/hoppity/api-operations/type-aliases/eventhandler/)
- [HandlerDeclaration](/hoppity/api-operations/type-aliases/handlerdeclaration/)
- [RpcErrorCodeValue](/hoppity/api-operations/type-aliases/rpcerrorcodevalue/)
- [RpcHandler](/hoppity/api-operations/type-aliases/rpchandler/)

## Variables

- [RpcErrorCode](/hoppity/api-operations/variables/rpcerrorcode/)

## Functions

- [onCommand](/hoppity/api-operations/functions/oncommand/)
- [onEvent](/hoppity/api-operations/functions/onevent/)
- [onRpc](/hoppity/api-operations/functions/onrpc/)
- [withOperations](/hoppity/api-operations/functions/withoperations/)
