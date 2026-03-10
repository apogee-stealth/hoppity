# Hoppity Basic Pub/Sub Example

The simplest hoppity example — a publisher sends messages to an exchange, a subscriber consumes them from a queue. No RPC, no delayed publish, just the core middleware pipeline.

## What This Demonstrates

- `withTopology().use().build()` — the hoppity builder pattern
- `withCustomLogger()` — injecting a custom logger via `hoppity-logger`
- `withSubscriptions()` — auto-wiring subscription handlers via `hoppity-subscriptions`
- Rascal topology configuration (exchanges, queues, bindings, publications, subscriptions)
- Separate publisher/subscriber topologies — each service declares only what it needs
- Graceful shutdown with `broker.shutdown()`

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

Start the subscriber first so the queue exists before the publisher sends messages. The `dev:both` script handles this via `concurrently`.

## Expected Output

When running, you should see output like:

```
[Subscriber] Starting...
[Subscriber] Broker created successfully
[Subscriber] Running. Waiting for messages. Press Ctrl+C to stop
[Publisher] Starting...
[Publisher] Broker created successfully
[Publisher] Sent message #1: Hello from publisher (#1)
[Publisher] Running. Press Ctrl+C to stop
[Subscriber] Received message: { id: 1, text: 'Hello from publisher (#1)', ... }
[Publisher] Sent message #2: Hello from publisher (#2)
[Subscriber] Received message: { id: 2, text: 'Hello from publisher (#2)', ... }
```

Messages publish every 3 seconds by default (configurable via `PUBLISH_INTERVAL`).

## What to Look For in the Code

1. **Topology separation** (`src/publisher/messaging/topology.ts` vs `src/subscriber/messaging/topology.ts`) — the publisher only declares the exchange and publication; the subscriber declares the exchange, queue, binding, and subscription. Both declare the same exchange because RabbitMQ declarations are idempotent.

2. **Middleware ordering** (`src/subscriber/messaging/broker.ts`) — `withCustomLogger` runs first so downstream middleware logs through the custom logger. `withSubscriptions` runs last because it validates handler keys against the finalized topology.

3. **Subscription name mapping** — the subscription name `on_event` in the topology must exactly match the key in `withSubscriptions({ on_event: messageHandler })`. This is how hoppity-subscriptions wires handlers to queues.

4. **Message handler** (`src/subscriber/messaging/handlers/messageHandler.ts`) — receives parsed content (Rascal handles JSON deserialization) and calls `ackOrNack()` to acknowledge.

## Architecture

```
Publisher                  RabbitMQ                Subscriber
    |                         |                        |
    |-- publish to "events" ->|                        |
    |   (routing key:         |                        |
    |    event.created)       |                        |
    |                         |-- route to event_queue->|
    |                         |   (binding: event.#)   |-- messageHandler()
    |                         |                        |-- ackOrNack()
```

## Project Structure

```
src/
├── config.ts                      # Environment configuration
├── logger.ts                      # Custom Logger implementation
├── publisher/
│   ├── index.ts                   # Publisher entry point
│   └── messaging/
│       ├── topology.ts            # Exchange + publication
│       └── broker.ts              # Hoppity builder
└── subscriber/
    ├── index.ts                   # Subscriber entry point
    └── messaging/
        ├── topology.ts            # Exchange + queue + binding + subscription
        ├── broker.ts              # Hoppity builder with withSubscriptions
        └── handlers/
            └── messageHandler.ts  # Message handler
```

## Configuration

| Variable           | Default     | Description           |
| ------------------ | ----------- | --------------------- |
| `RABBITMQ_HOST`    | `localhost` | RabbitMQ host         |
| `RABBITMQ_PORT`    | `5672`      | RabbitMQ port         |
| `RABBITMQ_USER`    | `guest`     | RabbitMQ username     |
| `RABBITMQ_PASS`    | `guest`     | RabbitMQ password     |
| `RABBITMQ_VHOST`   | `/`         | RabbitMQ virtual host |
| `PUBLISH_INTERVAL` | `3000`      | Publish interval (ms) |

## Available Scripts

| Script                  | Description                            |
| ----------------------- | -------------------------------------- |
| `pnpm start:publisher`  | Start publisher with tsx               |
| `pnpm start:subscriber` | Start subscriber with tsx              |
| `pnpm dev`              | Start both services with tsx           |
| `pnpm dev:publisher`    | Start publisher with hot reloading     |
| `pnpm dev:subscriber`   | Start subscriber with hot reloading    |
| `pnpm dev:both`         | Start both services with hot reloading |
| `pnpm build`            | Build TypeScript                       |
| `pnpm clean`            | Clean build artifacts                  |

## RabbitMQ Management

- **URL**: http://localhost:15672
- **Credentials**: guest / guest
- Check the **Queues** tab to see `event_queue` and its message rate
- Check the **Exchanges** tab to see the `events` exchange
