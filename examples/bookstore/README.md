# Bookstore Example

A multi-service demo showing how `hoppity-contracts`, `hoppity-operations`, and the full hoppity middleware stack fit together in a realistic microservice architecture.

## What This Demonstrates

- `defineDomain` — shared domain contracts as the source of truth across services
- `buildServiceTopology` — declarative declaration of what a service publishes/consumes
- `withOperations` — typed handlers and a broker extended with typed publishing methods
- `withOutboundExchange` — routing all publications through a per-service fanout exchange
- Outbound exchange tapping — observing a service's traffic from the outside (audit pattern)
- Full middleware composition: `withCustomLogger` → domain middleware → `withSubscriptions`

## What This Does Not Demonstrate

- Error handling, retries, or dead-letter queues
- Persistence (state is in-memory, gone on restart)
- Horizontal scaling or competing consumers
- Production-grade security or configuration management

## Prerequisites

- Node.js 22+
- pnpm 9+
- Docker (for RabbitMQ)

## How to Run

```bash
# From the repo root — start RabbitMQ
docker compose up -d

# Install all workspace dependencies (from repo root)
pnpm install

# Run the demo (from this directory or via filter)
pnpm --filter @bookstore/runner start
```

The runner spawns `order-service` and `catalog-service` as child processes, waits for both to connect, then executes the scripted demo flow. You'll see TUI output tracing each step.

## Package Structure

```
examples/bookstore/
├── packages/
│   ├── bookstore-contracts/   # Shared domain types (Orders + Catalog)
│   ├── order-service/         # Owns the orders domain — RPC, commands, events
│   └── catalog-service/       # Reacts to order events, exposes stock RPC
└── runner/                    # Spawns both services and drives the demo flow
```

**Why contracts live in their own package**: Services must agree on message shapes without importing each other. `bookstore-contracts` is a dependency of all three service packages — changes to event schemas are immediately visible across the codebase, and TypeScript enforces the contract at compile time.

**Why `workspace:*`**: All cross-package references use pnpm workspace dependencies. No npm publishing required. The version is always whatever is currently in the repo.

## Architecture

```
bookstore-contracts
       |
   (imported by)
       |
  ┌────┴────┐              ┌─────────────┐
  │  order  │──(events)───▶│   catalog   │
  │ service │              │   service   │
  └────┬────┘              └─────────────┘
       │                          ▲
       │  order-service_outbound  │
       │  (fanout exchange)       │
       └────────────┐             │ getStockLevels RPC
                    ▼             │
              ┌──────────────────────┐
              │        runner        │
              │  (outbound tap +     │
              │   RPC caller +       │
              │   command sender)    │
              └──────────────────────┘
```

`order-service` uses `withOutboundExchange("order-service")` to route all its publications through a fanout exchange named `order-service_outbound`. The runner binds a tap queue to this exchange so it can observe all order-service outbound traffic — without order-service knowing or caring who is listening.

## Middleware Stacks

| Service         | Stack                                                                                |
| --------------- | ------------------------------------------------------------------------------------ |
| order-service   | `withCustomLogger` → `withOutboundExchange("order-service")` → `withOperations(...)` |
| catalog-service | `withCustomLogger` → `withOperations(...)`                                           |
| runner          | `withCustomLogger` → `withOperations(...)` → `withSubscriptions(...)`                |

`withCustomLogger` always goes first. Every middleware that runs after it will use the injected logger.

## The Demo Flow

### Set 1 — Create & Query (Steps 1–3)

**Step 1: `createOrder` (RPC)**
The runner sends a `createOrder` RPC to order-service with a list of items. Order-service creates the order, publishes an `orderCreated` event, and returns the full order object. The runner displays the created order.

Why RPC here: the runner needs the assigned `orderId` back. If this were a command, there'd be no return value.

**Step 2: `orderCreated` event (outbound tap)**
The runner was listening on the tap queue before it sent the RPC. When the `orderCreated` event fires as a side effect of order creation, it arrives on the tap and the runner displays it. Catalog-service also receives this event and decrements stock for each item.

**Step 3: `getOrderSummary` + stock levels (RPC)**
The runner queries `getStockLevels` from catalog-service and `getOrderSummary` from order-service to display current state. Before/after stock counts are shown side by side.

### Set 2 — Cancel & Query (Steps 4–6)

**Step 4: `cancelOrder` (Command)**
The runner sends a `cancelOrder` command to order-service. No response comes back — commands are fire-and-forget. Order-service marks the order cancelled and publishes `orderCancelled`.

Why a command here: the caller doesn't need anything back. It's an instruction, not a query.

**Step 5: `orderCancelled` event (outbound tap)**
Same tap pattern as step 2. Catalog-service receives the event and restores stock for the cancelled order's items. The `orderCancelled` event payload includes the order items so catalog-service doesn't need to maintain its own order history.

**Step 6: Stock restoration + order state (RPC)**
The runner queries stock levels and order summary one final time to confirm the cancellation is reflected in both services.

## Operation Type Guide

| Operation         | Type    | Reason                                                                      |
| ----------------- | ------- | --------------------------------------------------------------------------- |
| `createOrder`     | RPC     | Caller needs the created order (with assigned ID) back                      |
| `getOrderSummary` | RPC     | Caller needs the current order state                                        |
| `getStockLevels`  | RPC     | Caller needs current inventory data                                         |
| `cancelOrder`     | Command | Instruction to act — no data needed in return                               |
| `orderCreated`    | Event   | Notification that something happened — catalog-service reacts independently |
| `orderCancelled`  | Event   | Same — catalog-service restores stock without being directly called         |

## Key Teaching Points

**`defineDomain` produces typed contracts shared across services.**
Both services import `Orders` and `Catalog` from `@bookstore/contracts`. The routing key, queue name, exchange name, and Zod schema for each operation are all derived from the domain definition — no string literals scattered across services.

**`buildServiceTopology` declares what a service does.**
Each service calls `buildServiceTopology(baseTopology, serviceName, configure)` and uses the fluent API (`t.respondsToRpc(...)`, `t.publishesEvent(...)`, etc.) to declare its role. The underlying Rascal topology is generated from this declaration.

**`withOperations` wires typed handlers and extends the broker.**
The broker returned by `.build()` gains typed methods: `broker.request(Orders.rpc.createOrder, payload)`, `broker.sendCommand(Orders.commands.cancelOrder, payload)`. TypeScript enforces the payload and return types at the call site.

**`withOutboundExchange` creates an audit tap for all outbound traffic.**
When order-service calls `broker.publishEvent(Orders.events.orderCreated, payload)`, the message is routed through `order-service_outbound` (a fanout exchange) before reaching any subscribers. Any service that binds a queue to this exchange receives a copy. The runner uses this for observability without polluting order-service's subscription topology.

**`withCustomLogger` goes first so all downstream middleware uses it.**
If you put it after `withOperations`, the operations middleware will have already captured a reference to the default console logger. Middleware receives the logger from `context.logger` at execution time — so order matters.

## Configuration

| Variable         | Default     | Description   |
| ---------------- | ----------- | ------------- |
| `RABBITMQ_HOST`  | `localhost` | RabbitMQ host |
| `RABBITMQ_PORT`  | `5672`      | AMQP port     |
| `RABBITMQ_USER`  | `guest`     | Username      |
| `RABBITMQ_PASS`  | `guest`     | Password      |
| `RABBITMQ_VHOST` | `/`         | Virtual host  |

Copy `examples/bookstore/.env` and edit as needed. Defaults work out of the box with the repo's `docker compose` setup.

## RabbitMQ Management UI

After `docker compose up -d`, the management UI is at http://localhost:15672 (guest/guest).

Exchanges to look at:

- `order-service_outbound` — the fanout exchange that all order-service publications flow through
- `orders_createOrder_requests`, `orders_cancelOrder` — per-operation exchanges from `buildServiceTopology`

Queues to look at:

- `runner_order_service_tap` — the tap queue the runner binds to observe order-service traffic
- `runner_*_reply` — the runner's RPC reply queue (ephemeral, gone after the demo)
