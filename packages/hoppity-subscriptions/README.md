# @apogeelabs/hoppity-subscriptions

Subscription management middleware for hoppity - a Rascal broker configuration library.

## Overview

This plugin provides middleware for setting up subscription handlers in a hoppity pipeline. It validates subscription handlers against the broker topology and automatically wires up message listeners when the broker is created.

## Features

- ✅ **Topology Validation**: Validates that handler keys match subscriptions in the topology
- ✅ **Handler Validation**: Ensures all handlers are functions and checks for duplicates
- ✅ **Fail-Fast Pipeline**: Throws errors for missing/invalid subscriptions to prevent dead code
- ✅ **Automatic Setup**: Wires up message, error, and invalid_content event listeners
- ✅ **Async Support**: Handles both synchronous and asynchronous handler functions
- ✅ **Error Handling**: Comprehensive error handling with detailed logging
- ✅ **Broker Access**: Provides broker instance as 4th parameter to handlers
- ✅ **Context Integration**: Stores validated subscriptions in middleware context for diagnostics

## Installation

```bash
pnpm add @apogeelabs/hoppity-subscriptions
```

## Usage

### Basic Example

```typescript
import hoppity from "@apogeelabs/hoppity";
import { withSubscriptions } from "@apogeelabs/hoppity-subscriptions";

// Define your topology with subscriptions
const topology = {
    vhosts: {
        "/": {
            subscriptions: {
                "user-events": {
                    queue: "user-events-queue",
                    // ... other subscription config
                },
                "order-events": {
                    queue: "order-events-queue",
                    // ... other subscription config
                },
            },
        },
    },
};

// Define your handlers
const handlers = {
    "user-events": async (message, content, ackOrNack, broker) => {
        console.log("Processing user event:", content);
        // Your handler logic here
        ackOrNack();
    },
    "order-events": (message, content, ackOrNack, broker) => {
        console.log("Processing order event:", content);
        // Your handler logic here
        ackOrNack();
    },
};

// Create broker with subscription middleware
const broker = await hoppity.withTopology(topology).use(withSubscriptions(handlers)).build();
```

### Handler Function Signature

```typescript
type SubscriptionHandler = (
    message: Message,
    content: any,
    ackOrNackFn: AckOrNack,
    broker: BrokerAsPromised
) => Promise<void> | void;
```

### Validation

The middleware validates:

1. **Subscription Existence**: All handler keys must match subscription names in the topology
2. **Handler Functions**: All handlers must be functions
3. **No Duplicates**: No duplicate handler keys allowed

If validation fails, the pipeline fails with a descriptive error message including:

- Missing subscription names
- Invalid handlers
- Duplicate keys
- Available subscription names for reference

### Error Handling

The middleware provides automatic error handling:

- **Message Handler Errors**: Caught and logged, message is nacked with the error
- **Subscription Errors**: Logged as warnings
- **Invalid Content**: Logged as warnings
- **Setup Failures**: Pipeline fails immediately with enhanced error context
- **Async Handler Errors**: Promise rejections are caught and the message is nacked

### Context Integration

The middleware stores validated subscription information in the middleware context:

```typescript
// Access validated subscriptions from context
context.data.validatedSubscriptions; // Array of subscription names that passed validation
```

## API Reference

### `withSubscriptions(handlers: SubscriptionHandlers): MiddlewareFunction`

Creates a middleware function that sets up subscription handlers.

#### Parameters

- `handlers`: Object mapping subscription names to handler functions

#### Returns

A middleware function that can be used in the hoppity pipeline.

### `validateSubscriptionHandlers(topology: BrokerConfig, handlers: SubscriptionHandlers): ValidationResult`

Validates subscription handlers against the broker topology. This function is exported for standalone validation if needed.

#### Parameters

- `topology`: The broker topology configuration
- `handlers`: The subscription handlers object

#### Returns

A `ValidationResult` object with detailed validation information.

### Types

#### `SubscriptionHandler`

Handler function signature for processing subscription messages.

#### `SubscriptionHandlers`

Type for the handlers object: `Record<string, SubscriptionHandler>`

#### `ValidationResult`

Result object from validation with detailed error information:

```typescript
interface ValidationResult {
    isValid: boolean;
    missingSubscriptions: string[];
    availableSubscriptions: string[];
    invalidHandlers: string[];
    duplicateHandlers: string[];
    errorMessage?: string;
}
```

## Integration with Hoppity

This plugin integrates seamlessly with the hoppity middleware pipeline:

1. **Topology Phase**: Validates subscriptions and handlers
2. **Broker Creation**: Creates broker with validated topology
3. **Callback Phase**: Sets up subscription listeners and handlers

The middleware follows hoppity's fail-fast pattern and provides comprehensive logging throughout the process.

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Lint code
pnpm lint

# Format code
pnpm format
```

## License

ISC
