---
editUrl: false
next: false
prev: false
title: "@apogeelabs/hoppity-contracts"
---

## Example

```typescript
import { defineDomain, buildServiceTopology } from "@apogeelabs/hoppity-contracts";
import { z } from "zod";

const Inventory = defineDomain("inventory", {
    events: { created: z.object({ id: z.string() }) },
});

const topology = buildServiceTopology(baseConfig, "warehouse", t => {
    t.publishesEvent(Inventory.events.created);
});
```

## Interfaces

- [CommandContract](/hoppity/api-contracts/interfaces/commandcontract/)
- [DomainDefinition](/hoppity/api-contracts/interfaces/domaindefinition/)
- [DomainDefinitionInput](/hoppity/api-contracts/interfaces/domaindefinitioninput/)
- [EventContract](/hoppity/api-contracts/interfaces/eventcontract/)
- [HandlerOptions](/hoppity/api-contracts/interfaces/handleroptions/)
- [RpcContract](/hoppity/api-contracts/interfaces/rpccontract/)
- [TopologyBuilder](/hoppity/api-contracts/interfaces/topologybuilder/)

## Type Aliases

- [CommandContracts](/hoppity/api-contracts/type-aliases/commandcontracts/)
- [CommandsDefinition](/hoppity/api-contracts/type-aliases/commandsdefinition/)
- [EventContracts](/hoppity/api-contracts/type-aliases/eventcontracts/)
- [EventsDefinition](/hoppity/api-contracts/type-aliases/eventsdefinition/)
- [RpcContracts](/hoppity/api-contracts/type-aliases/rpccontracts/)
- [RpcDefinition](/hoppity/api-contracts/type-aliases/rpcdefinition/)
- [SubscriptionOptions](/hoppity/api-contracts/type-aliases/subscriptionoptions/)

## Functions

- [buildServiceTopology](/hoppity/api-contracts/functions/buildservicetopology/)
- [defineDomain](/hoppity/api-contracts/functions/definedomain/)
- [withOutboundExchange](/hoppity/api-contracts/functions/withoutboundexchange/)
