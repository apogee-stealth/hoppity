# Hoppity Delayed Publish Example

This example demonstrates how to use the Hoppity library with the `hoppity-delayed-publish` plugin to schedule messages for future delivery. Delayed Scheduler Service schedules delayed messages to be sent to Delayed Processor Service, and Delayed Processor Service processes them.

## Architecture

- **Delayed Scheduler Service**: Delayed message scheduler that uses `hoppity-delayed-publish` to schedule messages for future delivery to Delayed Processor Service
- **Delayed Processor Service**: Message processor that consumes delayed messages from Delayed Scheduler Service
- **RabbitMQ**: Message broker with delayed publish infrastructure (wait/ready queues with dead letter exchanges)
- **Hoppity**: Middleware pipeline with delayed publish capabilities

## Features Demonstrated

1. **Delayed Publishing**: Delayed Scheduler Service schedules messages to be published to Delayed Processor Service with configurable delays
2. **Delayed Message Processing**: Delayed Processor Service processes messages that arrive after their scheduled delay
3. **Different Delay Scenarios**: Regular delays (5 seconds) and long delays (30 seconds) with different processing logic
4. **Error Handling**: Graceful error handling for message processing
5. **Type-safe Delayed Publishing**: Using the `hoppity-delayed-publish` plugin with TypeScript support
6. **Service Communication**: Using `withBasicServiceComms` for service-specific exchanges

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
pnpm dev:delayed-scheduler-svc  # In one terminal
pnpm dev:delayed-processor-svc  # In another terminal

# Or start services without hot reloading
pnpm dev
```

### 4. Access RabbitMQ Management

- **RabbitMQ Management UI**: http://localhost:15672
    - Username: `guest`
    - Password: `guest`

## How Delayed Publishing Works

### Delayed Publish Infrastructure

The `hoppity-delayed-publish` plugin creates a sophisticated delayed publishing system:

1. **Wait Queue**: Messages are initially published to a wait queue with TTL (Time To Live)
2. **Dead Letter Exchange**: When messages expire in the wait queue, they're automatically moved to a ready queue
3. **Ready Queue**: The ready queue receives expired messages and processes them for re-publishing
4. **Re-publishing**: The plugin automatically re-publishes expired messages to their original destination

### Message Flow

```
Delayed Scheduler Service    RabbitMQ                    Delayed Processor Service
    |                           |                           |
    |-- schedule delayed ------->|                           |
    |   (to wait queue)         |                           |
    |                           |-- TTL expires ----------->|
    |                           |-- move to ready queue     |
    |                           |-- re-publish ------------>|
    |                           |                           |-- process message
    |                           |                           |
```

## Configuration

### Environment Variables

| Variable                  | Default                    | Description                      |
| ------------------------- | -------------------------- | -------------------------------- |
| `RABBITMQ_HOST`           | `localhost`                | RabbitMQ host                    |
| `RABBITMQ_PORT`           | `5672`                     | RabbitMQ port                    |
| `RABBITMQ_USER`           | `guest`                    | RabbitMQ username                |
| `RABBITMQ_PASS`           | `guest`                    | RabbitMQ password                |
| `RABBITMQ_VHOST`          | `/`                        | RabbitMQ virtual host            |
| `SERVICE_A_INTERVAL`      | `3000`                     | Message scheduling interval (ms) |
| `SERVICE_B_QUEUE_NAME`    | `delayed-example-queue`    | Service B queue name             |
| `SERVICE_B_EXCHANGE_NAME` | `delayed-example-exchange` | Service B exchange name          |
| `DELAYED_EXCHANGE`        | `delayed-exchange`         | Delayed exchange name            |
| `DEFAULT_DELAY`           | `5000`                     | Default delay in milliseconds    |
| `MAX_DELAY`               | `30000`                    | Maximum delay in milliseconds    |

## Hoppity Usage

### Delayed Scheduler Service (Delayed Message Scheduler)

```typescript
const broker = await hoppity
    .withTopology(delayedSchedulerTopology)
    .use(withBasicServiceComms({ serviceName: "delayed_scheduler" }))
    .use(
        withDelayedPublish({
            serviceName: "delayed_scheduler",
            instanceId: randomUUID(),
            defaultDelay: config.delayed.defaultDelay,
        })
    )
    .use(schedulerServicePlugin)
    .build();

// Schedule a message to be published in 5 seconds
await broker.delayedPublish(
    "delayed-example-exchange-publication",
    {
        id: 1,
        service: "Delayed Scheduler Service",
        message: "Hello from Delayed Scheduler Service",
    },
    undefined,
    5000 // 5 second delay
);
```

### Delayed Processor Service (Message Processor)

```typescript
const broker = await hoppity
    .withTopology(delayedProcessorTopology)
    .use(withBasicServiceComms({ serviceName: "delayed_processor" }))
    .use(
        withDelayedPublish({
            serviceName: "delayed_processor",
            instanceId: randomUUID(),
            defaultDelay: config.delayed.defaultDelay,
        })
    )
    .use(delayedProcessorPlugin)
    .build();

// Messages are automatically consumed from the queue
// Processing logic is handled in delayedProcessorPlugin
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
├── delayed-scheduler-svc/
│   ├── index.ts               # Delayed Scheduler Service entry point
│   ├── schedulerService.ts    # Delayed Scheduler Service logic
│   └── messaging/
│       ├── broker.ts          # Broker configuration
│       └── topology.ts        # Delayed Scheduler Service topology
└── delayed-processor-svc/
    ├── index.ts               # Delayed Processor Service entry point
    └── messaging/
        ├── broker.ts          # Broker configuration
        ├── topology.ts        # Delayed Processor Service topology
        └── handlers/
            ├── index.ts       # Handler exports
            └── delayedMessageHandler.ts # Message processing logic
```

## Delayed Publish Features

### Automatic Infrastructure Setup

The `withDelayedPublish` middleware automatically creates:

- **Wait Queue**: `{serviceName}_wait` - holds messages until TTL expires
- **Ready Queue**: `{serviceName}_ready` - receives expired messages for re-publishing
- **Error Queue**: `{serviceName}_delayed_errors` - handles failed re-publishes
- **Dead Letter Bindings**: Automatic routing from wait to ready queue
- **Publications and Subscriptions**: For delayed message handling

### Flexible Delay Options

```typescript
// Use default delay
await broker.delayedPublish("publication", message);

// Specify custom delay
await broker.delayedPublish("publication", message, undefined, 10000);

// Use publication overrides
await broker.delayedPublish("publication", message, { persistent: true }, 5000);
```

### Error Handling

The plugin includes comprehensive error handling:

- **Queue Full**: Handles when wait queue is at capacity
- **Re-publish Failures**: Automatic retry with exponential backoff
- **Maximum Retries**: Configurable retry limits
- **Error Queue**: Failed messages are moved to error queue for manual inspection

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
pnpm dev:delayed-scheduler-svc
pnpm dev:delayed-processor-svc

# Start services without hot reloading
pnpm dev

# Build TypeScript (if needed)
pnpm build
```

## Monitoring and Debugging

### RabbitMQ Management UI

Access the RabbitMQ Management UI at http://localhost:15672 to monitor:

- **Queues**: Check wait, ready, and error queues
- **Exchanges**: View delayed publish exchanges
- **Message Flow**: See messages moving through the system
- **Queue Metrics**: Monitor queue depths and processing rates

### Service Logs

Both services provide detailed logging:

- **Delayed Scheduler Service**: Shows scheduled messages
- **Delayed Processor Service**: Shows received messages and processing results
- **Delayed Publish**: Shows infrastructure setup and message flow

### Common Debugging Scenarios

1. **Messages not being processed**: Check if Delayed Processor Service is running and connected
2. **Delays not working**: Verify wait/ready queue setup in RabbitMQ Management
3. **Connection issues**: Verify RabbitMQ is running and credentials are correct

## Available Scripts

| Script                             | Description                                        |
| ---------------------------------- | -------------------------------------------------- |
| `pnpm start:delayed-scheduler-svc` | Start Delayed Scheduler Service with tsx           |
| `pnpm start:delayed-processor-svc` | Start Delayed Processor Service with tsx           |
| `pnpm dev`                         | Start both services with tsx                       |
| `pnpm dev:delayed-scheduler-svc`   | Start Delayed Scheduler Service with hot reloading |
| `pnpm dev:delayed-processor-svc`   | Start Delayed Processor Service with hot reloading |
| `pnpm dev:both`                    | Start both services with hot reloading             |
| `pnpm build`                       | Build TypeScript                                   |
| `pnpm clean`                       | Clean build artifacts                              |

## Troubleshooting

### Common Issues

1. **RabbitMQ not running**: Make sure RabbitMQ is running on localhost:5672
2. **Port conflicts**: Make sure ports 5672 and 15672 are available
3. **Connection refused**: Check RabbitMQ credentials in `.env` file
4. **Delayed messages not processing**: Check wait/ready queue setup in RabbitMQ Management

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
- **Monitor delayed queues**: Look for `{serviceName}_wait` and `{serviceName}_ready` queues

## Next Steps

This example demonstrates basic delayed publish functionality. You can extend it by:

1. **Adding more complex scheduling**: Implement cron-like scheduling patterns
2. **Implementing retry logic**: Add exponential backoff for failed messages
3. **Adding message persistence**: Use durable queues for production scenarios
4. **Implementing monitoring**: Add metrics and alerting for delayed message processing
5. **Adding message validation**: Validate message structure before processing
6. **Implementing message routing**: Route different message types to different processors
7. **Adding message transformation**: Transform messages during processing
8. **Implementing message correlation**: Track related messages across services

## License

This example is part of the Hoppity project and follows the same license.
