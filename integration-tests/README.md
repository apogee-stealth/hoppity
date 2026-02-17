# Integration Tests

End-to-end tests for hoppity packages against a real RabbitMQ instance.

## Prerequisites

- **Docker** — tests use [Testcontainers](https://node.testcontainers.org/) to spin up a RabbitMQ container automatically. No manual Docker setup is needed, but Docker must be running.

## Running

From the repo root:

```bash
pnpm test:integration
```

Or directly:

```bash
pnpm --filter @apogeelabs/integration-tests test:integration
```

## How It Works

- **Global setup/teardown** — a RabbitMQ container is started once before all tests and torn down after (see `src/setup/`).
- **Serial execution** — tests run with `maxWorkers: 1` to avoid port conflicts and race conditions against the shared RabbitMQ instance.
- **60-second timeout** — container startup and message round-trips can be slow, so the default Jest timeout is extended.

## Test Suites

| Suite             | What it covers                                        |
| ----------------- | ----------------------------------------------------- |
| `core`            | Core hoppity topology builder and middleware pipeline |
| `rpc`             | RPC request/response with correlation IDs             |
| `delayed-publish` | TTL-based delayed message handling                    |
| `subscriptions`   | Auto-wiring subscription handlers                     |
| `combined`        | Multiple middleware composed together                 |

## Helpers

- `createTestTopology` — builds a minimal topology config for testing
- `silentLogger` — a no-op logger to suppress broker noise during tests
- `waitForMessage` — promise-based helper that resolves when a message arrives (with timeout)
