# delayed-publish — LLM Usage Guide

Reference for LLMs generating code based on this example.

## What This Example Is

Two-service example demonstrating TTL-based delayed message delivery using `hoppity-delayed-publish`. A scheduler publishes messages with a configurable delay, and a processor consumes them after the delay expires.

## Imports

```typescript
// Core builder + type utility
import hoppity, { BrokerWithExtensions } from "@apogeelabs/hoppity";

// Middleware
import { withCustomLogger } from "@apogeelabs/hoppity-logger";
import { withDelayedPublish, DelayedPublishBroker } from "@apogeelabs/hoppity-delayed-publish";
import { withSubscriptions } from "@apogeelabs/hoppity-subscriptions";

// Rascal types
import { BrokerAsPromised, BrokerConfig } from "rascal";
```

## How Delayed Publishing Works

The middleware creates a TTL-based dead-letter routing chain:

1. `delayedPublish()` sends the message to a **wait queue** with a per-message TTL
2. When the TTL expires, RabbitMQ dead-letters the message to a **ready queue**
3. A consumer on the ready queue re-publishes the message to its original destination
4. The processor service receives the message on its normal queue

The wait/ready queue infrastructure is created automatically by the middleware.

## Builder Patterns

### Scheduler (publishes delayed messages)

```typescript
import { randomUUID } from "crypto";

const broker = await hoppity
    .withTopology(schedulerTopology)
    .use(withCustomLogger({ logger }))
    .use(withBasicServiceComms({ serviceName: "delayed_scheduler_svc" }))
    .use(
        withDelayedPublish({
            serviceName: "delayed_scheduler_svc",
            instanceId: randomUUID(),
            defaultDelay: 5000, // ms
        })
    )
    .build();
```

### Processor (consumes delayed messages)

```typescript
const broker = await hoppity
    .withTopology(processorTopology)
    .use(withCustomLogger({ logger }))
    .use(withBasicServiceComms({ serviceName: "delayed_processor_svc" }))
    .use(
        withDelayedPublish({
            serviceName: "delayed_processor_svc",
            instanceId: randomUUID(),
            defaultDelay: 5000,
        })
    )
    .use(withSubscriptions(subscriptionHandlers))
    .build();
```

## Publishing with a Delay

```typescript
// Cast to get the delayedPublish method
const delayedBroker = broker as BrokerWithExtensions<[DelayedPublishBroker]>;

await delayedBroker.delayedPublish(
    "delayed-example-exchange-publication", // publication name
    { id: 1, message: "Delayed hello" }, // payload
    undefined, // publication overrides (optional)
    5000 // delay in ms
);
```

Arguments:

1. Publication name (from topology)
2. Message payload
3. Rascal publication overrides (or `undefined`)
4. Delay in milliseconds

## withDelayedPublish Options

```typescript
withDelayedPublish({
    serviceName: string;     // Used to name the wait/ready queues
    instanceId: string;      // Unique per process (use randomUUID())
    defaultDelay: number;    // Default delay in ms (overridable per-publish)
})
```

## Middleware Ordering

1. `withCustomLogger` — first (so downstream middleware uses the custom logger)
2. `withBasicServiceComms` — adds inbound/outbound exchanges
3. `withDelayedPublish` — adds wait/ready queue infrastructure to topology
4. `withSubscriptions` — **last** (validates against the complete topology)

## Custom Middleware: withBasicServiceComms

This example includes a custom middleware that demonstrates hoppity's extensibility:

```typescript
const middleware = withBasicServiceComms({
    serviceName: "my_service",
    vhost: "/", // optional, defaults to "/"
});
```

Creates:

- `{serviceName}_inbound` — topic exchange (for receiving messages)
- `{serviceName}_outbound` — fanout exchange (for broadcasting)
- `{serviceName}_publication` — publication targeting the outbound exchange

Extends the broker with `publishToOutbound(message, overrides?)`.

## Topology Pattern

The processor declares the target exchange, queue, binding, and subscription:

```typescript
const processorTopology: BrokerConfig = {
    vhosts: {
        "/": {
            connection: { url: "amqp://..." },
            exchanges: {
                "delayed-exchange": { type: "direct", options: { durable: false } },
                "delayed-example-exchange": { type: "direct", options: { durable: false } },
            },
            queues: {
                "delayed-example-queue": { options: { durable: false } },
            },
            bindings: {
                "delayed-example-queue-binding": {
                    source: "delayed-example-exchange",
                    destination: "delayed-example-queue",
                    destinationType: "queue",
                    bindingKey: "delayed.message",
                },
            },
            subscriptions: {
                delayedMessageProcessor: { queue: "delayed-example-queue" },
            },
        },
    },
};
```

## Key Conventions

- `instanceId` must be unique per running process (use `randomUUID()`) — it's used in the wait/ready queue names so multiple instances don't collide
- Both services need `withDelayedPublish` — the scheduler to publish, the processor because the middleware sets up the dead-letter routing infrastructure
- The delayed exchange name must match between scheduler and processor
- Subscription names in topology must exactly match handler keys in `withSubscriptions()`

## File Structure

```
src/
├── shared/
│   ├── config.ts                         # Environment config (dotenv)
│   ├── logger.ts                         # Custom Logger implementation
│   └── plugins/
│       ├── index.ts                      # Plugin barrel exports
│       └── withBasicServiceComms.ts      # Custom middleware (inbound/outbound exchanges)
├── delayed-scheduler-svc/
│   ├── index.ts                          # Entry point + graceful shutdown
│   ├── schedulerService.ts               # Delayed publish loop
│   └── messaging/
│       ├── broker.ts                     # Hoppity builder with delayed publish
│       └── topology.ts                   # Scheduler topology
└── delayed-processor-svc/
    ├── index.ts                          # Entry point + graceful shutdown
    └── messaging/
        ├── broker.ts                     # Hoppity builder with subscriptions
        ├── topology.ts                   # Processor topology
        └── handlers/
            ├── index.ts                  # Handler barrel exports
            └── delayedMessageHandler.ts  # SubscriptionHandler implementation
```
