# Bookstore Example — LLM Usage Guide

Reference for LLMs generating code that follows the patterns demonstrated in this example. Covers the multi-service architecture, full code flow, key configuration decisions, and how to adapt the patterns for new services.

## What This Example Demonstrates

A multi-service bookstore using the full hoppity middleware stack:

- **`defineDomain`** — shared, typed domain contracts as the single source of truth
- **`buildServiceTopology`** — declarative topology: each service says what it publishes/consumes
- **`withOperations`** — typed handlers + typed outbound methods on the broker
- **`withOutboundExchange`** — per-service fanout exchange for observability/audit tapping
- **`withCustomLogger`** — tagged loggers injected before all other middleware
- **`withSubscriptions`** — manual subscription wiring (for the tap queue)

All three messaging patterns are shown: **RPC** (request/response), **commands** (fire-and-forget), and **events** (broadcast notifications).

## Architecture Overview

```
bookstore-contracts (shared types — imported by all three)
       |
  ┌────┴────┐              ┌─────────────┐
  │  order  │──(events)───>│   catalog   │
  │ service │              │   service   │
  └────┬────┘              └─────────────┘
       │                          ^
       │  order-service_outbound  │
       │  (fanout exchange)       │ getStockLevels RPC
       └────────────┐             │
                    v             │
              ┌──────────────────────┐
              │        runner        │
              │  (outbound tap +     │
              │   RPC caller +       │
              │   command sender)    │
              └──────────────────────┘
```

### Service Roles

| Service         | Role                                  | Operations                                                                                                                        |
| --------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| order-service   | Owns order lifecycle                  | Responds to `createOrder` RPC, `getOrderSummary` RPC, `cancelOrder` command; publishes `orderCreated` and `orderCancelled` events |
| catalog-service | Reacts to order events, exposes stock | Subscribes to `orderCreated` and `orderCancelled` events; responds to `getStockLevels` RPC                                        |
| runner          | Orchestrates the demo flow            | Calls RPCs, sends commands, taps order-service outbound exchange                                                                  |

## Code Flow

### 1. Define Domain Contracts (`bookstore-contracts`)

Each domain is defined once with `defineDomain()` and shared across all services:

```typescript
// packages/bookstore-contracts/src/orders.ts
export const Orders = defineDomain("orders", {
    events: {
        orderCreated: z.object({ orderId: z.string(), items: z.array(...), total: z.number() }),
        orderCancelled: z.object({ orderId: z.string(), items: z.array(...) }),
    },
    commands: {
        cancelOrder: z.object({ orderId: z.string() }),
    },
    rpc: {
        createOrder: {
            request: z.object({ items: z.array(orderItemSchema) }),
            response: orderResponseSchema,
        },
        getOrderSummary: {
            request: z.object({ orderId: z.string() }),
            response: orderResponseSchema,
        },
    },
});
```

The `defineDomain` call produces typed contract objects. Each contract carries its routing key, queue name, exchange name, and Zod schema — no string literals needed downstream.

### 2. Declare Service Topology

Each service calls `buildServiceTopology` to declare what it does. The function generates the Rascal `BrokerConfig` (exchanges, queues, bindings, subscriptions, publications) from the declaration.

```typescript
// order-service/src/messaging/topology.ts
export const topology = buildServiceTopology(baseTopology, "order-service", t => {
    t.respondsToRpc(Orders.rpc.createOrder);
    t.respondsToRpc(Orders.rpc.getOrderSummary);
    t.handlesCommand(Orders.commands.cancelOrder);
    t.publishesEvent(Orders.events.orderCreated);
    t.publishesEvent(Orders.events.orderCancelled);
});

// catalog-service/src/messaging/topology.ts
export const topology = buildServiceTopology(baseTopology, "catalog-service", t => {
    t.subscribesToEvent(Orders.events.orderCreated);
    t.subscribesToEvent(Orders.events.orderCancelled);
    t.respondsToRpc(Catalog.rpc.getStockLevels);
});

// runner/src/messaging/topology.ts (before augmentation)
const topologyWithRpcCalls = buildServiceTopology(baseTopology, "runner", t => {
    t.callsRpc(Orders.rpc.createOrder);
    t.callsRpc(Orders.rpc.getOrderSummary);
    t.sendsCommand(Orders.commands.cancelOrder);
    t.callsRpc(Catalog.rpc.getStockLevels);
});
```

### 3. Compose Middleware and Build Broker

Each service composes its middleware stack via the builder pattern:

```typescript
// order-service
const broker = (await hoppity
    .withTopology(topology)
    .use(withCustomLogger({ logger }))
    .use(withOutboundExchange("order-service"))
    .use(
        withOperations({
            serviceName: "order-service",
            instanceId: randomUUID(),
            handlers: [createOrderHandler, getOrderSummaryHandler, cancelOrderHandler],
        })
    )
    .build()) as OperationsBroker;

// catalog-service
const broker = (await hoppity
    .withTopology(topology)
    .use(withCustomLogger({ logger }))
    .use(
        withOperations({
            serviceName: "catalog-service",
            instanceId: randomUUID(),
            handlers: [onOrderCreatedHandler, onOrderCancelledHandler, getStockLevelsHandler],
        })
    )
    .build()) as OperationsBroker;
```

### 4. Use Typed Broker Methods

The `OperationsBroker` gains typed methods from `withOperations`:

```typescript
// RPC — request/response, TypeScript enforces payload and return types
const order = await broker.request(Orders.rpc.createOrder, {
    items: [{ productId: "widget-1", quantity: 3 }],
});
// order: { orderId: string, items: ResolvedOrderItem[], total: number, status: "active" | "cancelled" }

// Command — fire-and-forget
await broker.sendCommand(Orders.commands.cancelOrder, { orderId });

// Event — broadcast (published inside a handler)
await broker.publishEvent(Orders.events.orderCreated, { orderId, items, total });
```

## Key Configuration Decisions

### Middleware Ordering

| Position | Middleware                                  | Reason                                                                            |
| -------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| 1st      | `withCustomLogger`                          | Downstream middleware captures logger reference at execution time. Must go first. |
| 2nd      | `withOutboundExchange` (order-service only) | Rewrites publication routing before `withOperations` wires handlers.              |
| Last     | `withOperations`                            | Wires handlers and extends broker. Must see final topology.                       |

### Why `withOutboundExchange` Only on Order-Service

Order-service is the only service that publishes events other services observe. The fanout exchange (`order-service_outbound`) allows the runner to tap all outbound traffic without order-service knowing who listens. Catalog-service doesn't publish events, so it doesn't need one.

### Runner's Manual Topology Augmentation

The runner calls RPCs but has no inbound handlers. Because `withOperations` only adds RPC reply infrastructure when it detects `onRpc` handlers, the runner must pre-create the reply queue and subscription in its topology before the middleware runs. The `augmentTopology` function handles this.

The runner also manually adds a tap queue bound to order-service's fanout exchange. This is wired via `withSubscriptions` (not `withOperations`) because it's a raw Rascal subscription, not a typed contract-based handler.

### Race Condition Prevention in the Runner

The runner registers tap event waiters **before** sending the RPC/command that triggers the event:

```typescript
// Register BEFORE sending — the event fires as a side effect of createOrder
const orderCreatedPromise = awaitTapEvent(ROUTING_KEY_ORDER_CREATED);
const createdOrder = await broker.request(Orders.rpc.createOrder, { items: [...] });
await orderCreatedPromise;
```

If the waiter were registered after the RPC, the event could arrive on the tap queue before the listener exists, causing the runner to hang.

## Adapting This Pattern

### Adding a New Service

1. Define its domain contracts in `bookstore-contracts` (or a new shared package)
2. Create a `topology.ts` using `buildServiceTopology` — declare what it publishes/consumes
3. Create a `broker.ts` composing the middleware stack
4. Create handler files using `onEvent`, `onCommand`, or `onRpc`
5. If the service publishes events others should observe, add `withOutboundExchange`

### Adding a New Operation to an Existing Domain

1. Add the operation to the `defineDomain` call in the contracts package
2. Add the topology declaration (`t.respondsToRpc(...)`, `t.publishesEvent(...)`, etc.) in each service that participates
3. Create the handler and add it to the `handlers` array in `withOperations`
4. Callers gain typed methods automatically — `broker.request(NewDomain.rpc.newOp, payload)`

### Adding a New Event Subscriber

1. Import the event contract from the shared contracts package
2. Add `t.subscribesToEvent(SomeDomain.events.someEvent)` to the service's topology
3. Create an `onEvent` handler and add it to `withOperations`

### Operation Type Decision Guide

| Need data back from the target? | Multiple services should react? | Use                                                    |
| ------------------------------- | ------------------------------- | ------------------------------------------------------ |
| Yes                             | No                              | **RPC** — `t.respondsToRpc` / `t.callsRpc`             |
| No                              | No                              | **Command** — `t.handlesCommand` / `t.sendsCommand`    |
| N/A                             | Yes                             | **Event** — `t.publishesEvent` / `t.subscribesToEvent` |

## File Structure Reference

```
examples/bookstore/
├── packages/
│   ├── bookstore-contracts/
│   │   └── src/
│   │       ├── index.ts          # Barrel export for Orders + Catalog
│   │       ├── orders.ts         # Orders domain (events, commands, RPCs)
│   │       └── catalog.ts        # Catalog domain (getStockLevels RPC)
│   ├── order-service/
│   │   └── src/
│   │       ├── index.ts          # Service entry point
│   │       ├── config.ts         # RabbitMQ connection config
│   │       ├── logger.ts         # Tagged logger for withCustomLogger
│   │       ├── store.ts          # In-memory order store
│   │       └── messaging/
│   │           ├── topology.ts   # buildServiceTopology declaration
│   │           ├── broker.ts     # Middleware composition + singleton
│   │           └── handlers/
│   │               ├── createOrder.ts
│   │               ├── getOrderSummary.ts
│   │               └── cancelOrder.ts
│   └── catalog-service/
│       └── src/
│           ├── index.ts          # Service entry point
│           ├── config.ts         # RabbitMQ connection config
│           ├── logger.ts         # Tagged logger for withCustomLogger
│           ├── store.ts          # In-memory product catalog + stock
│           └── messaging/
│               ├── topology.ts   # buildServiceTopology declaration
│               ├── broker.ts     # Middleware composition + singleton
│               └── handlers/
│                   ├── onOrderCreated.ts
│                   ├── onOrderCancelled.ts
│                   └── getStockLevels.ts
└── runner/
    └── src/
        ├── index.ts              # Demo orchestration script
        ├── config.ts             # RabbitMQ config + service paths
        ├── logger.ts             # Tagged logger for withCustomLogger
        ├── output.ts             # TUI formatting helpers
        ├── processManager.ts     # Child process spawning
        └── messaging/
            ├── topology.ts       # buildServiceTopology + manual augmentation
            ├── broker.ts         # Middleware composition + singleton
            └── tapHandler.ts     # Outbound exchange tap handler
```
