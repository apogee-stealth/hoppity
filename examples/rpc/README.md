# Hoppity RPC Example

Demonstrates `hoppity-rpc` for request/response messaging between two services over RabbitMQ. The initiator sends periodic RPC calls, the handler processes them and returns responses. Correlation IDs, reply queues, and routing are all managed automatically by the RPC middleware.

## What This Demonstrates

- `withRpcSupport()` — RPC middleware that adds exchange, queues, bindings, and broker methods
- `broker.request()` — making RPC calls that return a Promise resolving with the handler's response
- `broker.addRpcListener()` — registering a handler function for incoming RPC requests
- `withCustomLogger()` — custom logger injection via `hoppity-logger`
- `withBasicServiceComms()` — a custom middleware example (inbound/outbound exchanges)
- `BrokerWithExtensions` — TypeScript-safe broker type that includes methods from multiple middleware

## How RPC Works Over RabbitMQ

RabbitMQ doesn't have native RPC — it's a messaging broker, not an RPC framework. The `hoppity-rpc` middleware implements the RPC pattern using standard AMQP primitives:

1. **Shared RPC exchange**: Both services declare the same topic exchange (e.g., `rpc-exchange`). This is the routing hub for all RPC traffic.

2. **Per-instance queues**: Each service instance gets two exclusive, auto-delete queues:
    - **Inbound queue** — receives RPC requests routed by `serviceName` (binding: `rpc.{serviceName}.#.request`)
    - **Reply queue** — receives RPC responses matched by correlation ID

3. **Request flow**:
    - Initiator calls `broker.request("rpc_handler_svc.process_message", payload)`
    - Middleware generates a `correlationId` (UUID), stores a pending Promise
    - Message is published to the RPC exchange with routing key `rpc.rpc_handler_svc.process_message.request`
    - The `replyTo` field contains the initiator's reply queue name

4. **Handler flow**:
    - Handler's inbound queue receives the request (matched by binding pattern)
    - `addRpcListener` callback processes the request and returns a response
    - Middleware publishes the response to RabbitMQ's default exchange with routing key = `replyTo` (the initiator's reply queue name)

5. **Response flow**:
    - Initiator's reply queue receives the response
    - `correlationId` matches it to the pending Promise, which resolves with the response payload

6. **Timeout**: If no response arrives within `defaultTimeout` (10s in this example), the Promise rejects with `RPC_TIMEOUT`.

```
RPC Initiator              RabbitMQ                  RPC Handler
    |                          |                          |
    |-- broker.request() ----->|                          |
    |   correlationId: abc-123 |                          |
    |   replyTo: rpc_init_reply|                          |
    |   routingKey: rpc.rpc_   |                          |
    |     handler_svc.process  |                          |
    |     _message.request     |                          |
    |                          |-- route to inbound queue->|
    |                          |                          |-- addRpcListener()
    |                          |                          |-- process & return
    |                          |<-- publish to default    |
    |                          |    exchange, routingKey:  |
    |                          |    rpc_init_reply         |
    |<-- correlationId match --|                          |
    |    Promise resolves      |                          |
```

## Prerequisites

- Node.js 22+
- pnpm
- Docker (for RabbitMQ)

## Quick Start

```bash
# Start RabbitMQ
docker compose up -d

# Copy environment template (optional — defaults work out of the box)
cp env.example .env

# Install dependencies (from repo root)
pnpm install

# Start both services with hot reloading
pnpm dev:both
```

## What to Look For

When both services are running, you'll see output like:

```
📥 [Handler] Received RPC request: { id: 1710000000000, service: 'RPC Initiator', ... }
✅ [Handler] RPC request processed: 1710000000000
✅ [Initiator] RPC response (request 1710000000000): { processed: true, requestId: 1710000000000, ... }
```

Key things to observe:

- **Request IDs match** — the initiator's request ID appears in the handler's log and in the response
- **Round-trip timing** — the handler adds a 100ms simulated delay; total round-trip includes AMQP overhead
- **Error handling** — stop the handler and watch the initiator's requests timeout after 10s
- **RabbitMQ Management UI** (http://localhost:15672) — check the Exchanges tab for the RPC exchange and the Queues tab for the exclusive reply/inbound queues

## Project Structure

```
src/
├── shared/
│   ├── config.ts                   # Environment configuration (shared by both services)
│   ├── logger.ts                   # Custom Logger implementation
│   └── plugins/
│       ├── index.ts                # Plugin barrel exports
│       └── withBasicServiceComms.ts # Custom middleware example
├── rpc-initiator-svc/
│   ├── index.ts                    # Initiator entry point (client side)
│   ├── initiatorService.ts         # Periodic RPC call loop
│   └── messaging/
│       ├── broker.ts               # Hoppity builder with RPC middleware
│       └── topology.ts             # Base topology (connection only)
└── rpc-handler-svc/
    ├── index.ts                    # Handler entry point (server side)
    ├── handlerService.ts           # RPC listener registration
    └── messaging/
        ├── broker.ts               # Hoppity builder with RPC middleware
        └── topology.ts             # Base topology (connection only)
```

## Configuration

| Variable            | Default        | Description                                          |
| ------------------- | -------------- | ---------------------------------------------------- |
| `RABBITMQ_HOST`     | `localhost`    | RabbitMQ host                                        |
| `RABBITMQ_PORT`     | `5672`         | RabbitMQ port                                        |
| `RABBITMQ_USER`     | `guest`        | RabbitMQ username                                    |
| `RABBITMQ_PASS`     | `guest`        | RabbitMQ password                                    |
| `RABBITMQ_VHOST`    | `/`            | RabbitMQ virtual host                                |
| `RPC_CALL_INTERVAL` | `5000`         | How often the initiator sends an RPC request (ms)    |
| `RPC_EXCHANGE`      | `rpc-exchange` | RPC exchange name (must match between both services) |

## Available Scripts

| Script                         | Description                            |
| ------------------------------ | -------------------------------------- |
| `pnpm start:rpc-initiator-svc` | Start initiator with tsx               |
| `pnpm start:rpc-handler-svc`   | Start handler with tsx                 |
| `pnpm dev`                     | Start both services with tsx           |
| `pnpm dev:rpc-initiator-svc`   | Start initiator with hot reloading     |
| `pnpm dev:rpc-handler-svc`     | Start handler with hot reloading       |
| `pnpm dev:both`                | Start both services with hot reloading |
| `pnpm build`                   | Build TypeScript                       |
| `pnpm clean`                   | Clean build artifacts                  |

## RabbitMQ Management

- **URL**: http://localhost:15672
- **Credentials**: guest / guest
- Check the **Queues** tab to see RPC queues (look for `rpc_*_reply` and `rpc_*_inbound`)
- Check the **Exchanges** tab to see the RPC exchange routing
- Queues are exclusive and auto-delete — they disappear when the service disconnects
