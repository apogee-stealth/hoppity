---
"@apogeelabs/hoppity": minor
---

RPC requests now publish with the AMQP `mandatory` flag. When a request is unroutable (no responder declared), the broker returns it and the caller rejects immediately with the new `RpcErrorCode.NO_RESPONDER` instead of waiting out `defaultTimeout`. The RPC caller publication uses a confirm channel, which is required for the broker's `return` to surface.

Note: this catches unroutable requests (no responder queue bound), not a responder whose durable queue exists but is currently offline — that case still falls through to the timeout.
