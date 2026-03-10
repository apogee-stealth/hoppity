# Hoppity RPC Example — LLM Usage Guide

This example demonstrates the request/response (RPC) pattern over RabbitMQ using `@apogeelabs/hoppity-rpc`. Two services communicate synchronously: the initiator sends requests and awaits responses, the handler processes requests and returns results.

## Pattern: RPC Over AMQP

RPC over a message broker works by combining:

- A **shared topic exchange** for routing requests by service name
- **Exclusive reply queues** per service instance for receiving responses
- **Correlation IDs** to match responses to their original requests

This is not native to RabbitMQ — the `withRpcSupport` middleware builds all the infrastructure automatically.

## RPC Flow With Correlation IDs

```
1. Initiator calls broker.request("rpc_handler_svc.process_message", payload)
2. Middleware generates correlationId (UUID), stores pending Promise
3. Request published to RPC exchange:
   - routingKey: "rpc.rpc_handler_svc.process_message.request"
   - replyTo: initiator's reply queue name
   - correlationId: the UUID
4. Handler's inbound queue bound to "rpc.rpc_handler_svc.#.request" receives request
5. addRpcListener callback runs, returns response object
6. Middleware publishes response to default exchange:
   - routingKey: replyTo (initiator's reply queue name)
   - correlationId: same UUID from request
7. Initiator's reply queue subscription matches correlationId → resolves Promise
```

## Key Configuration Decisions

### Both services need `withRpcSupport`

The initiator needs it for its reply queue. The handler needs it for its inbound queue. They share the same `rpcExchange` name so requests route correctly.

### `instanceId` must be unique per process

Each running instance gets exclusive, auto-delete queues named with the `instanceId`. Using `randomUUID()` ensures multiple instances of the same service don't compete for each other's responses.

### `serviceName` determines routing

The RPC name convention is `serviceName.methodName`. The handler's inbound queue binding pattern is `rpc.{serviceName}.#.request`, so all methods for that service land on the same queue.

### Middleware order matters

```typescript
hoppity
    .withTopology(baseTopology)          // 1. Base connection config
    .use(withCustomLogger({ logger }))   // 2. Logger first — all downstream middleware uses it
    .use(withBasicServiceComms({ ... })) // 3. Service exchanges (optional, for non-RPC comms)
    .use(withRpcSupport({ ... }))        // 4. RPC infrastructure last
    .build()
```

### Base topology is minimal

The topology files only contain connection details. All exchanges, queues, bindings, publications, and subscriptions are added by middleware. This is the recommended pattern — let middleware compose the AMQP infrastructure.

## Broker Setup Pattern

```typescript
import hoppity, { BrokerWithExtensions } from "@apogeelabs/hoppity";
import { withCustomLogger } from "@apogeelabs/hoppity-logger";
import { RpcBroker, withRpcSupport } from "@apogeelabs/hoppity-rpc";
import { randomUUID } from "crypto";

// Singleton pattern — getBroker() caches the instance
let brokerInstance: BrokerWithExtensions<[RpcBroker]> | null = null;

export async function getBroker(): Promise<BrokerWithExtensions<[RpcBroker]>> {
    if (brokerInstance) return brokerInstance;

    brokerInstance = (await hoppity
        .withTopology({
            vhosts: {
                "/": {
                    connection: { url: "amqp://guest:guest@localhost:5672/" },
                },
            },
        })
        .use(withCustomLogger({ logger }))
        .use(
            withRpcSupport({
                serviceName: "my-service",
                instanceId: randomUUID(),
                rpcExchange: "rpc-exchange",
                defaultTimeout: 10000,
            })
        )
        .build()) as BrokerWithExtensions<[RpcBroker]>;

    return brokerInstance;
}
```

## Making RPC Requests (Initiator Side)

```typescript
const broker = await getBroker();

// request() returns a Promise that resolves with the handler's return value
const response = await broker.request("target_service.method_name", {
    id: 123,
    message: "Hello",
});

// response is whatever the handler returned — no wrapper, no envelope
console.log(response);
```

## Handling RPC Requests (Handler Side)

```typescript
const broker = await getBroker();

// The callback is async. Return value becomes the RPC response.
broker.addRpcListener("my_service.method_name", async request => {
    // request is the payload from broker.request() — no envelope
    const result = await doSomeWork(request);
    return result; // sent back to the initiator
});
```

## Adapting This Example

### Adding a new RPC method

1. Register a new `addRpcListener` on the handler with a unique name
2. Call `broker.request()` on the initiator with that same name
3. No topology changes needed — the binding pattern `rpc.{serviceName}.#.request` catches all methods for the service

### Adding a third service

1. Create a new service directory with the same structure
2. Use `withRpcSupport` with a new `serviceName`
3. Both services must use the same `rpcExchange` value
4. The new service can both make and handle RPC calls

### Using `BrokerWithExtensions` with multiple middleware

```typescript
import { BasicServiceComms } from "./plugins";
import { RpcBroker } from "@apogeelabs/hoppity-rpc";

// Union of all extension interfaces — TypeScript knows about all added methods
type MyBroker = BrokerWithExtensions<[BasicServiceComms, RpcBroker]>;
```

### Error handling

```typescript
import { RpcErrorCode } from "@apogeelabs/hoppity-rpc";

try {
    const response = await broker.request("service.method", payload);
} catch (error) {
    // error.code will be one of:
    // - RPC_TIMEOUT: no response within defaultTimeout
    // - RPC_HANDLER_ERROR: handler threw an error
    // - RPC_METHOD_NOT_FOUND: no listener registered for that rpcName
    // - RPC_CANCELLED: request was cancelled via broker.cancelRequest()
    // - RPC_SERVICE_UNAVAILABLE: service is not reachable
}
```

## File Map

| File                                          | Role                                                  |
| --------------------------------------------- | ----------------------------------------------------- |
| `src/shared/config.ts`                        | Centralized env config — both services import this    |
| `src/shared/logger.ts`                        | Custom `Logger` implementation for `withCustomLogger` |
| `src/shared/plugins/withBasicServiceComms.ts` | Custom middleware adding service exchanges            |
| `src/rpc-initiator-svc/messaging/broker.ts`   | Hoppity builder pipeline (initiator)                  |
| `src/rpc-initiator-svc/messaging/topology.ts` | Base Rascal topology (connection only)                |
| `src/rpc-initiator-svc/initiatorService.ts`   | Periodic `broker.request()` loop                      |
| `src/rpc-handler-svc/messaging/broker.ts`     | Hoppity builder pipeline (handler)                    |
| `src/rpc-handler-svc/messaging/topology.ts`   | Base Rascal topology (connection only)                |
| `src/rpc-handler-svc/handlerService.ts`       | `broker.addRpcListener()` registration                |
