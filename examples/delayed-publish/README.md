# Hoppity Delayed Publish Example

Demonstrates `hoppity-delayed-publish` for scheduling messages with a delay before delivery. The scheduler publishes messages with a configurable TTL, and the processor consumes them after the delay expires.

## What This Demonstrates

- `withDelayedPublish()` — delayed publish middleware with TTL-based wait/ready queue infrastructure
- `broker.delayedPublish()` — publishing messages with a delay
- `withSubscriptions()` — auto-wiring subscription handlers via `hoppity-subscriptions`
- `withCustomLogger()` — custom logger injection via `hoppity-logger`
- `withBasicServiceComms()` — a custom middleware example (inbound/outbound exchanges)

## How Delayed Publishing Works

1. **Wait Queue**: Messages are published to a wait queue with a TTL (Time To Live)
2. **Dead Letter Exchange**: When messages expire, they're routed to a ready queue
3. **Ready Queue**: Expired messages are picked up and re-published to their original destination
4. **Delivery**: The processor receives the message after the delay

```
Scheduler                  RabbitMQ                    Processor
    |                          |                           |
    |-- delayedPublish() ----->|                           |
    |   (to wait queue w/TTL) |                           |
    |                          |-- TTL expires             |
    |                          |-- dead letter to ready    |
    |                          |-- re-publish ------------>|
    |                          |                           |-- messageHandler()
```

## Prerequisites

- Node.js 22+
- pnpm
- RabbitMQ running locally

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

Or use the setup script: `./scripts/setup.sh`

## Project Structure

```
src/
├── shared/
│   ├── config.ts                      # Environment configuration
│   ├── logger.ts                      # Custom Logger implementation
│   └── plugins/
│       ├── index.ts                   # Plugin exports
│       └── withBasicServiceComms.ts   # Custom middleware example
├── delayed-scheduler-svc/
│   ├── index.ts                       # Scheduler entry point
│   ├── schedulerService.ts            # Delayed publish loop
│   └── messaging/
│       ├── broker.ts                  # Hoppity builder with delayed publish
│       └── topology.ts               # Scheduler topology
└── delayed-processor-svc/
    ├── index.ts                       # Processor entry point
    └── messaging/
        ├── broker.ts                  # Hoppity builder with subscriptions
        ├── topology.ts               # Processor topology
        └── handlers/
            ├── index.ts               # Handler exports
            └── delayedMessageHandler.ts # Message handler
```

## Configuration

| Variable                 | Default                    | Description                      |
| ------------------------ | -------------------------- | -------------------------------- |
| `RABBITMQ_HOST`          | `localhost`                | RabbitMQ host                    |
| `RABBITMQ_PORT`          | `5672`                     | RabbitMQ port                    |
| `RABBITMQ_USER`          | `guest`                    | RabbitMQ username                |
| `RABBITMQ_PASS`          | `guest`                    | RabbitMQ password                |
| `RABBITMQ_VHOST`         | `/`                        | RabbitMQ virtual host            |
| `SCHEDULER_INTERVAL`     | `3000`                     | Message scheduling interval (ms) |
| `PROCESSOR_QUEUE_NAME`   | `delayed-example-queue`    | Processor queue name             |
| `PROCESSOR_EXCHANGE_NAME`| `delayed-example-exchange` | Processor exchange name          |
| `DELAYED_EXCHANGE`       | `delayed-exchange`         | Delayed exchange name            |
| `DEFAULT_DELAY`          | `5000`                     | Default delay in milliseconds    |
| `MAX_DELAY`              | `30000`                    | Maximum delay in milliseconds    |

## Available Scripts

| Script                             | Description                                        |
| ---------------------------------- | -------------------------------------------------- |
| `pnpm start:delayed-scheduler-svc` | Start scheduler with tsx                           |
| `pnpm start:delayed-processor-svc` | Start processor with tsx                           |
| `pnpm dev`                         | Start both services with tsx                       |
| `pnpm dev:delayed-scheduler-svc`   | Start scheduler with hot reloading                 |
| `pnpm dev:delayed-processor-svc`   | Start processor with hot reloading                 |
| `pnpm dev:both`                    | Start both services with hot reloading             |
| `pnpm build`                       | Build TypeScript                                   |
| `pnpm clean`                       | Clean build artifacts                              |

## RabbitMQ Management

- **URL**: http://localhost:15672
- **Credentials**: guest / guest
- Check the **Queues** tab for wait, ready, and processor queues
- Monitor queue depths and message flow to see the delay in action
