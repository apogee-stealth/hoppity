---
editUrl: false
next: false
prev: false
title: "@apogeelabs/hoppity-delayed-publish"
---

## Example

```typescript
import { withDelayedPublish, type DelayedPublishBroker } from "@apogeelabs/hoppity-delayed-publish";

const broker = (await hoppity
    .withTopology(topology)
    .use(withDelayedPublish({ serviceName: "svc", instanceId: randomUUID() }))
    .build()) as DelayedPublishBroker;

await broker.delayedPublish("my_publication", payload, undefined, 5_000);
```

## Enumerations

- [DelayedPublishErrorCode](/hoppity/api-delayed-publish/enumerations/delayedpublisherrorcode/)

## Classes

- [DelayedPublishError](/hoppity/api-delayed-publish/classes/delayedpublisherror/)

## Interfaces

- [DelayedMessage](/hoppity/api-delayed-publish/interfaces/delayedmessage/)
- [DelayedPublishBroker](/hoppity/api-delayed-publish/interfaces/delayedpublishbroker/)
- [DelayedPublishOptions](/hoppity/api-delayed-publish/interfaces/delayedpublishoptions/)

## Functions

- [withDelayedPublish](/hoppity/api-delayed-publish/functions/withdelayedpublish/)
