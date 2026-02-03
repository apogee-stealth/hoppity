# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Hoppity

Pattern-driven RabbitMQ topology for Node.js microservices, built on the Rascal library. A composable middleware pipeline where each middleware receives topology config + shared context, can modify both, and optionally hook into broker lifecycle via `onBrokerCreated` callbacks.

## Monorepo Layout

pnpm workspaces + Turborepo. Five packages under `packages/`, two example apps under `examples/`.

- **hoppity** — Core middleware pipeline and builder API
- **hoppity-rpc** — Request/response RPC with correlation IDs
- **hoppity-delayed-publish** — TTL-based delayed message handling
- **hoppity-subscriptions** — Auto-wiring subscription handlers to broker
- **hoppity-logger** — Custom logger injection (Winston, Pino, etc.)

## Commands

All commands run from repo root unless noted.

```bash
pnpm install              # Install all deps
pnpm build                # Build all packages (turbo-cached)
pnpm test                 # Run all tests
pnpm lint                 # ESLint across all packages
pnpm format               # Prettier across all packages
pnpm dev                  # Watch mode for all packages
```

Single package operations:

```bash
pnpm --filter hoppity test           # Test one package
pnpm --filter hoppity build          # Build one package
pnpm --filter hoppity test -- --watch  # Jest watch mode for one package
```

Release workflow uses Changesets:

```bash
pnpm changeset            # Create a changeset
pnpm version-packages     # Bump versions from changesets
pnpm release              # Build + publish to npm
```

## Architecture

**Builder pattern** — `withTopology().use(middleware).build()` produces a configured Rascal broker.

**Middleware signature:**

```typescript
(topology: BrokerConfig, context: MiddlewareContext) => MiddlewareResult;
```

Each middleware returns modified topology and an optional `onBrokerCreated` async callback. Context object is shared across the middleware chain for state passing.

**Build output** — Each package produces CJS (`dist/index.js`), ESM (`dist/index.mjs`), and type declarations (`dist/index.d.ts`) via tsup.

## Code Style

- TypeScript strict mode, target ES2022
- Prettier: 4-space indent, 100 char width, double quotes, semicolons, trailing commas (es5), LF line endings
- ESLint: `@typescript-eslint/no-explicit-any` is a warning (not error); unused vars prefixed with `_` are allowed
- Path alias: `@apogeelabs/*` maps to `packages/*/src`

## Unit Tests

When generating or modifying unit tests, follow the conventions in `.ai/UnitTestGeneration.md` and examples in `.ai/UnitTestExamples.md`.

## Node Version

Node 22 (see `.nvmrc`). pnpm 8.7.5 (enforced via `packageManager` field).
