# Hoppity RPC Example

Demonstrates `hoppity-rpc` for request/response messaging between two services. The initiator sends periodic RPC calls, the handler processes them and returns responses. Correlation IDs are managed automatically by the RPC middleware.

## What This Demonstrates

- `withRpcSupport()` — RPC middleware with automatic correlation management
- `broker.request()` — making type-safe RPC calls
- `broker.addRpcListener()` — handling RPC requests and returning responses
- `withCustomLogger()` — custom logger injection via `hoppity-logger`
- `withBasicServiceComms()` — a custom middleware example (inbound/outbound exchanges)

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

## Architecture

```
RPC Initiator            RabbitMQ              RPC Handler
    |                        |                        |
    |-- broker.request() --->|                        |
    |                        |-- route to RPC queue -->|
    |                        |                        |-- addRpcListener()
    |                        |                        |-- process & return
    |<-- RPC response -------|<-- reply ---------------|
```

## Project Structure

```
src/
├── shared/
│   ├── config.ts                   # Environment configuration
│   ├── logger.ts                   # Custom Logger implementation
│   └── plugins/
│       ├── index.ts                # Plugin exports
│       └── withBasicServiceComms.ts # Custom middleware example
├── rpc-initiator-svc/
│   ├── index.ts                    # Initiator entry point
│   ├── initiatorService.ts         # RPC call loop
│   └── messaging/
│       ├── broker.ts               # Hoppity builder with RPC
│       └── topology.ts             # Initiator topology
└── rpc-handler-svc/
    ├── index.ts                    # Handler entry point
    ├── handlerService.ts           # RPC listener setup
    └── messaging/
        ├── broker.ts               # Hoppity builder with RPC
        └── topology.ts             # Handler topology
```

## Configuration

| Variable            | Default        | Description            |
| ------------------- | -------------- | ---------------------- |
| `RABBITMQ_HOST`     | `localhost`    | RabbitMQ host          |
| `RABBITMQ_PORT`     | `5672`         | RabbitMQ port          |
| `RABBITMQ_USER`     | `guest`        | RabbitMQ username      |
| `RABBITMQ_PASS`     | `guest`        | RabbitMQ password      |
| `RABBITMQ_VHOST`    | `/`            | RabbitMQ virtual host  |
| `RPC_CALL_INTERVAL` | `5000`         | RPC call interval (ms) |
| `RPC_EXCHANGE`      | `rpc-exchange` | RPC exchange name      |

## Available Scripts

| Script                         | Description                                    |
| ------------------------------ | ---------------------------------------------- |
| `pnpm start:rpc-initiator-svc` | Start initiator with tsx                       |
| `pnpm start:rpc-handler-svc`   | Start handler with tsx                         |
| `pnpm dev`                     | Start both services with tsx                   |
| `pnpm dev:rpc-initiator-svc`   | Start initiator with hot reloading             |
| `pnpm dev:rpc-handler-svc`     | Start handler with hot reloading               |
| `pnpm dev:both`                | Start both services with hot reloading         |
| `pnpm build`                   | Build TypeScript                               |
| `pnpm clean`                   | Clean build artifacts                          |

## RabbitMQ Management

- **URL**: http://localhost:15672
- **Credentials**: guest / guest
- Check the **Queues** tab to see RPC queues and message flow
- Check the **Exchanges** tab to see the RPC exchange routing
