# Hoppity RPC Example

This example demonstrates how to use the Hoppity library with RPC middleware for service-to-service communication. The RPC Initiator Service makes RPC calls to the RPC Handler Service, which processes the requests and returns responses.

## Architecture

- **RPC Initiator Service**: RPC client that sends periodic requests to RPC Handler Service
- **RPC Handler Service**: RPC server that processes requests from RPC Initiator Service and returns responses
- **RabbitMQ**: Message broker with exchanges and queues for RPC message routing
- **Hoppity**: Middleware pipeline with RPC capabilities

## Features Demonstrated

1. **RPC Communication**: RPC Initiator Service makes RPC calls to RPC Handler Service with automatic correlation management
2. **Type-safe RPC**: Generic method signatures for type safety
3. **Automatic Correlation**: Request/response matching with correlation IDs
4. **Package Plugins**: Using plugins from the hoppity packages
5. **Service Communication**: Using withBasicServiceComms for service-specific exchanges

## Prerequisites

- Node.js 18+
- pnpm
- RabbitMQ running locally (see setup instructions below)

## RabbitMQ Setup

You need RabbitMQ running locally. Here are a few options:

### Option 1: Install RabbitMQ locally

```bash
# macOS with Homebrew
brew install rabbitmq
brew services start rabbitmq

# Ubuntu/Debian
sudo apt-get install rabbitmq-server
sudo systemctl start rabbitmq-server
```

### Option 2: Use Docker for RabbitMQ only

```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

### Option 3: Use Docker Compose for RabbitMQ only

Create a `docker-compose.rabbitmq.yml`:

```yaml
version: "3.8"
services:
    rabbitmq:
        image: rabbitmq:3-management
        ports:
            - "5672:5672"
            - "15672:15672"
        environment:
            - RABBITMQ_DEFAULT_USER=guest
            - RABBITMQ_DEFAULT_PASS=guest
```

Then run:

```bash
docker-compose -f docker-compose.rabbitmq.yml up -d
```

## Quick Start

### 1. Setup Environment

```bash
# Copy environment template
cp env.example .env

# Edit .env if you want to customize settings (optional)
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start Services

```bash
# Start both services in development mode with hot reloading
pnpm dev:both

# Or start services individually
pnpm dev:rpc-initiator-svc  # In one terminal
pnpm dev:rpc-handler-svc  # In another terminal

# Or start services without hot reloading
pnpm dev
```

### 4. Access RabbitMQ Management

- **RabbitMQ Management UI**: http://localhost:15672
    - Username: `guest`
    - Password: `guest`

## Development Workflow

### Making Changes

1. **Service Code Changes**: Automatically reflected with hot reloading
2. **Hoppity Library Changes**: Service will auto-restart
3. **Dependency Changes**: Run `pnpm install` and restart services

### Development Commands

```bash
# Start both services with hot reloading
pnpm dev:both

# Start individual services with hot reloading
pnpm dev:rpc-initiator-svc
pnpm dev:rpc-handler-svc

# Start services without hot reloading
pnpm dev

# Build TypeScript (if needed)
pnpm build
```

## Project Structure

```
src/
├── shared/
│   ├── config.ts              # Environment configuration
│   └── plugins/
│       ├── index.ts           # Export shared plugins
│       ├── withBasicServiceComms.ts # Service communication middleware
│       └── contextExample.ts  # Context example middleware
├── rpc-initiator-svc/
│   ├── index.ts               # RPC Initiator Service entry point
│   ├── initiatorService.ts    # RPC Initiator Service business logic
│   └── messaging/
│       ├── broker.ts          # Broker configuration
│       └── topology.ts        # RPC Initiator Service topology
└── rpc-handler-svc/
    ├── index.ts               # RPC Handler Service entry point
    ├── handlerService.ts      # RPC Handler Service business logic
    └── messaging/
        ├── broker.ts          # Broker configuration
        └── topology.ts        # RPC Handler Service topology
```

## Configuration

### Environment Variables

| Variable             | Default        | Description            |
| -------------------- | -------------- | ---------------------- |
| `RABBITMQ_HOST`      | `localhost`    | RabbitMQ host          |
| `RABBITMQ_PORT`      | `5672`         | RabbitMQ port          |
| `RABBITMQ_USER`      | `guest`        | RabbitMQ username      |
| `RABBITMQ_PASS`      | `guest`        | RabbitMQ password      |
| `RABBITMQ_VHOST`     | `/`            | RabbitMQ virtual host  |
| `SERVICE_A_INTERVAL` | `5000`         | RPC call interval (ms) |
| `RPC_EXCHANGE`       | `rpc-exchange` | RPC exchange name      |

## Hoppity Usage

### RPC Initiator Service (RPC Client)

```typescript
const broker = await hoppity
    .withTopology(rpcInitiatorTopology)
    .use(withBasicServiceComms({ serviceName: "rpc_initiator_svc" }))
    .use(
        withRpcSupport({
            serviceName: "rpc_initiator_svc",
            instanceId: randomUUID(),
            rpcExchange: config.service.rpcExchange,
            defaultTimeout: 10000,
        })
    )
    .build();

// Make RPC calls to RPC Handler Service
const response = await broker.request("rpc_handler_svc.process_message", {
    id: Date.now(),
    service: "RPC Initiator",
    timestamp: new Date().toISOString(),
    message: "Hello from RPC Initiator",
});
```

### RPC Handler Service (RPC Server)

```typescript
const broker = await hoppity
    .withTopology(rpcHandlerTopology)
    .use(withBasicServiceComms({ serviceName: "rpc_handler_svc" }))
    .use(
        withRpcSupport({
            serviceName: "rpc_handler_svc",
            instanceId: randomUUID(),
            rpcExchange: config.service.rpcExchange,
            defaultTimeout: 10000,
        })
    )
    .build();

// RPC handlers are automatically set up to process requests from RPC Initiator Service
broker.addRpcListener("rpc_handler_svc.process_message", async request => {
    // Process RPC request and return response
    return {
        processed: true,
        requestId: request.id,
        message: `Processed: ${request.message}`,
    };
});
```

## Message Flow

The example demonstrates RPC communication between two services:

### RPC Flow

1. **RPC Initiator Service makes RPC call** to RPC Handler Service via `broker.request()`
2. **RPC Handler Service processes RPC request** and returns response
3. **RPC middleware handles correlation** and delivers response to RPC Initiator Service

### Message Flow Diagram

```
RPC Initiator Service        RabbitMQ              RPC Handler Service
        |                        |                        |
        |-- RPC call ----------->|                        |
        |                        |-- route to RPC queue -->|
        |                        |                        |-- process RPC
        |                        |                        |
        |<-- RPC response -------|                        |
        |                        |                        |
```

## Available Scripts

| Script                         | Description                                    |
| ------------------------------ | ---------------------------------------------- |
| `pnpm start:rpc-initiator-svc` | Start RPC Initiator Service with tsx           |
| `pnpm start:rpc-handler-svc`   | Start RPC Handler Service with tsx             |
| `pnpm dev`                     | Start both services with tsx                   |
| `pnpm dev:rpc-initiator-svc`   | Start RPC Initiator Service with hot reloading |
| `pnpm dev:rpc-handler-svc`     | Start RPC Handler Service with hot reloading   |
| `pnpm dev:both`                | Start both services with hot reloading         |
| `pnpm build`                   | Build TypeScript                               |
| `pnpm clean`                   | Clean build artifacts                          |

## Troubleshooting

### Common Issues

1. **RabbitMQ not running**: Make sure RabbitMQ is running on localhost:5672
2. **Port conflicts**: Make sure ports 5672 and 15672 are available
3. **Connection refused**: Check RabbitMQ credentials in `.env` file

### Debugging

```bash
# Check if RabbitMQ is running
curl http://localhost:15672/api/overview

# View service logs in terminal
# (logs are displayed directly in the terminal when running with tsx)

# Access RabbitMQ management
open http://localhost:15672
```

### RabbitMQ Management

- **Management UI**: http://localhost:15672
- **Default credentials**: guest/guest
- **Check queues**: Go to Queues tab to see message flow
- **Check exchanges**: Go to Exchanges tab to see routing

## Next Steps

This example demonstrates basic Hoppity usage with RPC middleware. You can extend it by:

1. Adding more complex message processing
2. Implementing error handling and retry logic
3. Adding more middleware plugins
4. Implementing message acknowledgment strategies
5. Adding metrics and monitoring
6. Using withCustomLogger for structured logging
7. Adding pub/sub messaging with hoppity-subscriptions

## License

This example is part of the Hoppity project and follows the same license.
